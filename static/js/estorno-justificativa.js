(function() {
    'use strict';

    let initialized = false;
    let currentResolver = null;

    let modalEl = null;
    let titleEl = null;
    let subtitleEl = null;
    let textareaEl = null;
    let cancelBtnEl = null;
    let saveBtnEl = null;
    let closeBtnEl = null;
    let errorEl = null;

    function closeModal(result) {
        if (!modalEl) return;

        modalEl.classList.remove('show');
        document.body.style.overflow = '';

        if (currentResolver) {
            const resolve = currentResolver;
            currentResolver = null;
            resolve(result);
        }
    }

    function showError(message) {
        if (!errorEl) return;
        errorEl.textContent = message || '';
        errorEl.style.display = message ? 'block' : 'none';
    }

    function initialize() {
        if (initialized) return true;

        modalEl = document.getElementById('estornoJustificativaModal');
        if (!modalEl) return false;

        titleEl = document.getElementById('estornoJustificativaTitle');
        subtitleEl = document.getElementById('estornoJustificativaSubtitle');
        textareaEl = document.getElementById('estornoJustificativaInput');
        cancelBtnEl = document.getElementById('cancelEstornoJustificativa');
        saveBtnEl = document.getElementById('saveEstornoJustificativa');
        closeBtnEl = document.getElementById('closeEstornoJustificativa');
        errorEl = document.getElementById('estornoJustificativaError');

        const overlay = modalEl.querySelector('.estorno-justificativa-overlay');

        if (overlay) {
            overlay.addEventListener('click', function() {
                closeModal(null);
            });
        }

        if (cancelBtnEl) {
            cancelBtnEl.addEventListener('click', function() {
                closeModal(null);
            });
        }

        if (closeBtnEl) {
            closeBtnEl.addEventListener('click', function() {
                closeModal(null);
            });
        }

        if (saveBtnEl) {
            saveBtnEl.addEventListener('click', function() {
                const justificativa = (textareaEl?.value || '').trim();
                if (!justificativa) {
                    showError('A justificativa para ESTORNO é obrigatória.');
                    textareaEl?.focus();
                    return;
                }
                closeModal(justificativa);
            });
        }

        if (textareaEl) {
            textareaEl.addEventListener('input', function() {
                if ((textareaEl.value || '').trim()) {
                    showError('');
                }
            });
        }

        document.addEventListener('keydown', function(event) {
            if (!modalEl || !modalEl.classList.contains('show')) return;
            if (event.key === 'Escape') {
                closeModal(null);
            }
        });

        initialized = true;
        return true;
    }

    window.solicitarJustificativaEstorno = function(options = {}) {
        const ok = initialize();
        if (!ok) {
            return Promise.resolve(null);
        }

        const cardTitle = options.cardTitle || 'Solicitação';
        const origem = options.sourceName || 'status atual';
        const destino = options.targetName || 'Estorno';

        if (titleEl) {
            titleEl.textContent = `Justificativa para mover para ${destino}`;
        }
        if (subtitleEl) {
            subtitleEl.textContent = `"${cardTitle}" - de "${origem}" para "${destino}"`;
        }
        if (textareaEl) {
            textareaEl.value = '';
        }
        showError('');

        modalEl.classList.add('show');
        document.body.style.overflow = 'hidden';

        setTimeout(function() {
            textareaEl?.focus();
        }, 40);

        return new Promise(function(resolve) {
            currentResolver = resolve;
        });
    };
})();
