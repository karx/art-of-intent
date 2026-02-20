import { functions, httpsCallable } from './firebase-config.js';

class ApiDiagnosticWidget {
    constructor(container) {
        this.container = container;
        this.render();
        this.setupListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="api-diagnostic-widget">
                <div class="api-diagnostic-header">
                    <span class="api-diagnostic-title">System Diagnostics</span>
                    <button class="btn-secondary diagnostic-btn" id="runApiTestBtn">Run Test</button>
                </div>

                <div class="api-diagnostic-status-bar" id="apiStatusDisplay" style="display: none;">
                    <div class="status-indicator" id="statusAuth" title="Checking authentication...">
                        <span class="status-icon">○</span> Auth
                    </div>
                    <div class="status-indicator" id="statusApi" title="Waiting for API response...">
                        <span class="status-icon">○</span> API
                    </div>
                    <div class="status-indicator" id="statusFormat" title="Validating response format...">
                        <span class="status-icon">○</span> Format
                    </div>
                    <div class="status-indicator" id="statusLatency" title="Latency (ms)">
                        <span class="status-icon">⏱</span> <span id="latencyValue">--</span>ms
                    </div>
                </div>

                <div class="api-diagnostic-details" id="apiDetailsPanel" style="display: none;">
                    <div class="details-section">
                        <div class="details-label" style="cursor: pointer; user-select: none;" id="toggleRequest">Request Details ▼</div>
                        <div class="details-content code-block hidden" id="requestDetails"></div>
                    </div>

                    <div class="details-section">
                        <div class="details-label" style="cursor: pointer; margin-top: 8px; user-select: none;" id="toggleResponse">Response Details ▼</div>
                        <div class="details-content code-block" id="responseDetails"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setupListeners() {
        const btn = this.container.querySelector('#runApiTestBtn');
        if (btn) {
            btn.addEventListener('click', () => this.runTest());
        }

        const toggleRequest = this.container.querySelector('#toggleRequest');
        if (toggleRequest) {
            toggleRequest.addEventListener('click', () => {
                const content = this.container.querySelector('#requestDetails');
                content.classList.toggle('hidden');
                toggleRequest.textContent = content.classList.contains('hidden') ? 'Request Details ▼' : 'Request Details ▲';
            });
        }

        const toggleResponse = this.container.querySelector('#toggleResponse');
        if (toggleResponse) {
            toggleResponse.addEventListener('click', () => {
                const content = this.container.querySelector('#responseDetails');
                content.classList.toggle('hidden');
                toggleResponse.textContent = content.classList.contains('hidden') ? 'Response Details ▼' : 'Response Details ▲';
            });
        }
    }

    updateStatus(id, state, message = '') {
        const el = this.container.querySelector(`#${id}`);
        if (!el) return;

        const icon = el.querySelector('.status-icon');

        // Remove old classes
        el.classList.remove('success', 'error', 'pending');
        if (state) el.classList.add(state);

        if (state === 'success') {
            if (icon) icon.textContent = '✓';
        } else if (state === 'error') {
            if (icon) icon.textContent = '✗';
        } else if (state === 'pending') {
            if (icon) icon.textContent = '...';
        } else {
            if (icon) icon.textContent = '○';
        }

        if (message) el.title = message;
    }

    async runTest() {
        const btn = this.container.querySelector('#runApiTestBtn');
        const statusDisplay = this.container.querySelector('#apiStatusDisplay');
        const detailsPanel = this.container.querySelector('#apiDetailsPanel');
        const requestDetails = this.container.querySelector('#requestDetails');
        const responseDetails = this.container.querySelector('#responseDetails');
        const latencyValue = this.container.querySelector('#latencyValue');

        // Reset UI
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Testing...';
        }
        if (statusDisplay) statusDisplay.style.display = 'flex';
        if (detailsPanel) detailsPanel.style.display = 'block'; // Show panel so we can see loading/errors

        this.updateStatus('statusAuth', 'pending');
        this.updateStatus('statusApi', 'pending');
        this.updateStatus('statusFormat', 'pending');
        if (latencyValue) latencyValue.textContent = '--';

        try {
            // 1. Check Auth
            // Use window.firebaseAuth since it's exported globally in firebase-config.js
            let user = null;
            if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                user = window.firebaseAuth.currentUser;
            } else if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
                 user = window.firebase.auth().currentUser;
            } else if (window.firebaseAuth && typeof window.firebaseAuth.getCurrentUser === 'function') {
                user = window.firebaseAuth.getCurrentUser();
            }

            if (user) {
                this.updateStatus('statusAuth', 'success', `Authenticated as ${user.uid}`);
            } else {
                this.updateStatus('statusAuth', 'error', 'Not authenticated');
                // Proceed to see what happens, although it should fail
            }

            // Prepare Request
            const testPrompt = "Test prompt for diagnostics";
            const requestPayload = {
                userPrompt: testPrompt,
                systemInstruction: "You are a test bot. Reply with 'OK'.",
                sessionId: "diagnostic-" + Date.now()
            };

            if (requestDetails) requestDetails.textContent = JSON.stringify(requestPayload, null, 2);

            // 2. Call API
            const startTime = performance.now();

            const artyGenerateHaiku = httpsCallable(functions, 'artyGenerateHaiku');

            // Execute the callable function
            // Note: If 'httpsCallable' returns a function that returns a Promise resolving to {data: ...}
            const result = await artyGenerateHaiku(requestPayload);

            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            if (latencyValue) latencyValue.textContent = latency;

            // 3. Validate Response
            const responseData = result.data;
            if (responseDetails) responseDetails.textContent = JSON.stringify(responseData, null, 2);

            if (responseData && responseData.success) {
                this.updateStatus('statusApi', 'success', 'API Call Successful');

                // 4. Check Format
                const innerData = responseData.data;
                if (innerData && typeof innerData.responseText === 'string') {
                     this.updateStatus('statusFormat', 'success', 'Response format valid');
                } else {
                     this.updateStatus('statusFormat', 'error', 'Missing expected fields (responseText)');
                }
            } else {
                const errorMessage = (responseData && responseData.error) ? responseData.error : 'Unknown API error';
                this.updateStatus('statusApi', 'error', errorMessage);
                this.updateStatus('statusFormat', 'error', 'API failed, cannot validate format');
            }

        } catch (error) {
            console.error(error);
            this.updateStatus('statusApi', 'error', error.message);
            this.updateStatus('statusFormat', 'error', 'Request failed');
            if (responseDetails) responseDetails.textContent = `Error: ${error.message}\n\nStack: ${error.stack}`;
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Run Test';
            }
        }
    }
}

export default ApiDiagnosticWidget;
