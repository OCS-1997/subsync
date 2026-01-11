import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Zap, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import './InstallPrompt.css';

const InstallPrompt = () => {
    const { isVisible, handleInstallClick, handleDismiss } = usePWAInstall();

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="install-prompt-overlay" onClick={handleDismiss}>
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="install-prompt-container"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="install-title"
                        aria-describedby="install-description"
                    >
                        <button
                            className="install-prompt-close"
                            onClick={handleDismiss}
                            aria-label="Close prompt"
                        >
                            <X size={20} />
                        </button>

                        <div className="install-prompt-content">
                            <div className="install-prompt-header">
                                <div className="install-app-icon">
                                    <img src="/pwa-192x192.png" alt="App Icon" />
                                </div>
                                <div>
                                    <h3 id="install-title">Install RMS</h3>
                                    <p id="install-description">Get the best experience on your device</p>
                                </div>
                            </div>

                            <div className="install-benefits">
                                <div className="benefit-item">
                                    <div className="benefit-icon fast">
                                        <Zap size={16} />
                                    </div>
                                    <span>Faster Access</span>
                                </div>
                                <div className="benefit-item">
                                    <div className="benefit-icon shield">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span>Secure & Offline</span>
                                </div>
                            </div>

                            <div className="install-actions">
                                <button
                                    className="btn-later"
                                    onClick={handleDismiss}
                                >
                                    Maybe Later
                                </button>
                                <button
                                    className="btn-install"
                                    onClick={handleInstallClick}
                                >
                                    <Download size={18} />
                                    <span>Install Now</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
