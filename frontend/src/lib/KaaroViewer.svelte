<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { httpsCallable } from 'firebase/functions';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
  import { functions, db } from '$lib/firebase';
  import { authState } from '$lib/stores/auth.svelte';

  // kaaroViewer deployed URL — update when the domain is set
  const KAARO_ORIGIN = import.meta.env.VITE_KAARO_ORIGIN ?? 'https://kaaroviewer.netlify.app';
  const KAARO_URL    = `${KAARO_ORIGIN}?embed=1`;

  let iframe: HTMLIFrameElement | undefined = $state();
  let ready = $state(false);

  const generateKaaroEntry = httpsCallable<{ prompt: string }, { text: string }>(
    functions,
    'generateKaaroEntry',
  );

  async function handleMessage(e: MessageEvent) {
    if (e.origin !== KAARO_ORIGIN) return;

    if (e.data?.type === 'kaaro:ready') {
      ready = true;
    }

    // kaaroViewer's LLM call — proxy through our authenticated CF
    if (e.data?.type === 'kaaro:llm-request') {
      const { requestId, prompt } = e.data as { requestId: string; prompt: string };
      try {
        const result = await generateKaaroEntry({ prompt });
        iframe?.contentWindow?.postMessage(
          { type: 'kaaro:llm-response', requestId, text: result.data.text },
          KAARO_ORIGIN,
        );
      } catch (err: any) {
        iframe?.contentWindow?.postMessage(
          { type: 'kaaro:llm-response', requestId, error: err.message ?? 'LLM call failed' },
          KAARO_ORIGIN,
        );
      }
    }

    // Pipeline complete — persist the brief to Firestore
    if (e.data?.type === 'kaaro:brief-ready') {
      const brief = e.data.brief;
      const uid   = authState.user?.uid;
      if (!uid || !brief?.meta?.id) return;
      try {
        await setDoc(doc(db, 'libraryEntries', brief.meta.id), {
          uid,
          brief,
          seed:      brief.meta.source ?? brief.meta.title ?? '',
          createdAt: serverTimestamp(),
          public:    false,
        });
      } catch (err) {
        console.error('[KaaroViewer] failed to save library entry:', err);
      }
    }
  }

  onMount(() => window.addEventListener('message', handleMessage));
  onDestroy(() => window.removeEventListener('message', handleMessage));
</script>

<div class="kaaro-wrap" class:kaaro-wrap--ready={ready}>
  {#if !ready}
    <div class="kaaro-loading">Loading kaaroViewer…</div>
  {/if}
  <iframe
    bind:this={iframe}
    src={KAARO_URL}
    title="kaaroViewer — knowledge explorer"
    allow="autoplay"
    class="kaaro-frame"
  ></iframe>
</div>

<style>
  .kaaro-wrap {
    position: relative;
    width: 100%;
    height: 80vh;
    min-height: 500px;
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    overflow: hidden;
    background: #0a0804;
  }

  .kaaro-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-dim, #666);
    font-size: 13px;
    letter-spacing: 1px;
    text-transform: uppercase;
    pointer-events: none;
    z-index: 1;
  }

  .kaaro-frame {
    width: 100%;
    height: 100%;
    border: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .kaaro-wrap--ready .kaaro-frame {
    opacity: 1;
  }

  .kaaro-wrap--ready .kaaro-loading {
    display: none;
  }
</style>
