"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaCheck, FaSpinner, FaClock } from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";
import Link from 'next/link';

const PumpTokenCreator = () => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null,
    twitter: '',
    telegram: '',
    website: '',
    directFeesTo: 'agorapilled'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [showLinks, setShowLinks] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState({});

  // Process steps
  const steps = [
    { id: 'wallet', label: 'Creating Wallet', icon: '🔑' },
    { id: 'funding', label: 'Funding Wallet', icon: '💰' },
    { id: 'metadata', label: 'Uploading Metadata', icon: '📝' },
    { id: 'token', label: 'Launching Token', icon: '🚀' },
    { id: 'saving', label: 'Saving Data', icon: '💾' },
    { id: 'complete', label: 'Processing', icon: '✅' }
  ];

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  // Auto-hide success toast after 8 seconds
  useEffect(() => {
    if (success && !loading) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setTokenData(null);
        setWalletData(null);
        setCurrentStep(0);
        setStepStatuses({});
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [success, loading]);

  // Auto-hide rate limit error after some time
  useEffect(() => {
    if (rateLimitError) {
      const timer = setTimeout(() => {
        setRateLimitError(null);
      }, 15000); // 15 seconds for fee account errors (longer because they're more serious)
      
      return () => clearTimeout(timer);
    }
  }, [rateLimitError]);

  const updateStepStatus = (stepId, status, delay = 0) => {
    setTimeout(() => {
      setStepStatuses(prev => ({
        ...prev,
        [stepId]: status
      }));
    }, delay);
  };

  const simulateProgress = () => {
    // Simulate wallet creation
    setCurrentStep(0);
    updateStepStatus('wallet', 'loading');
    
    // Simulate funding
    setTimeout(() => {
      updateStepStatus('wallet', 'complete');
      setCurrentStep(1);
      updateStepStatus('funding', 'loading');
    }, 1000);

    // Simulate metadata upload
    setTimeout(() => {
      updateStepStatus('funding', 'complete');
      setCurrentStep(2);
      updateStepStatus('metadata', 'loading');
    }, 3500);

    // Simulate token launch
    setTimeout(() => {
      updateStepStatus('metadata', 'complete');
      setCurrentStep(3);
      updateStepStatus('token', 'loading');
    }, 5000);

    // Simulate saving
    setTimeout(() => {
      updateStepStatus('token', 'complete');
      setCurrentStep(4);
      updateStepStatus('saving', 'loading');
    }, 5500);

    // Complete
    setTimeout(() => {
      updateStepStatus('saving', 'complete');
      setCurrentStep(5);
      updateStepStatus('complete', 'complete');
    }, 6000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Special handler for the directFeesTo field to auto-add @
  const handleDirectFeesToChange = (e) => {
    let value = e.target.value;
    
    // If user types something and it doesn't start with @, add it
    if (value && !value.startsWith('@')) {
      value = '@' + value;
    }
    
    setFormData(prev => ({
      ...prev,
      directFeesTo: value
    }));
  };

  // Function to ensure @ prefix when saving/submitting
  const getDirectFeesToValue = () => {
    const value = formData.directFeesTo.trim();
    if (value && !value.startsWith('@')) {
      return '@' + value;
    }
    return value;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Function to get rate limit display info
  const getRateLimitDisplayInfo = (rateLimitError) => {
    if (rateLimitError.rateLimitType === 'feeAccount') {
      return {
        title: 'Fee Account Limited',
        message: `${rateLimitError.feeAccount} has reached its daily limit (${rateLimitError.currentCount}/${rateLimitError.dailyLimit} tokens)`,
        timeInfo: `Resets in ${rateLimitError.hoursUntilReset} hours`,
        icon: <FaClock />,
        bgColor: 'bg-orange-500'
      };
    } else {
      return {
        title: 'Rate Limited',
        message: 'Too many requests from your IP',
        timeInfo: `Wait ${rateLimitError.remainingMinutes} minutes`,
        icon: <FaClock />,
        bgColor: 'bg-red-500'
      };
    }
  };

  const createPumpToken = async () => {
    if (!formData.name || !formData.symbol) {
      setError('Name and symbol are required');
      return;
    }

    setLoading(true);
    setError('');
    setRateLimitError(null);
    setSuccess(false);
    setCurrentStep(0);
    setStepStatuses({});

    // Start progress simulation
    simulateProgress();

    try {
      console.log('Starting token creation via API...');
      
      // Prepare form data for API
      const apiFormData = new FormData();
      apiFormData.append('name', formData.name);
      apiFormData.append('symbol', formData.symbol);
      apiFormData.append('description', formData.description);
      apiFormData.append('twitter', formData.twitter);
      apiFormData.append('telegram', formData.telegram);
      apiFormData.append('website', formData.website);
      
      if (formData.image) {
        apiFormData.append('image', formData.image);
      }

      // Call API route
      const response = await fetch('/api/tokens/create', {
        method: 'POST',
        body: apiFormData
      });

      const result = await response.json();

      // Handle rate limiting specifically
      if (response.status === 429) {
        setRateLimitError({
          message: result.error,
          remainingMinutes: result.remainingMinutes,
          lastCreation: result.lastCreation,
          rateLimitType: result.rateLimitType || 'ip',
          // Fee account specific fields
          feeAccount: result.feeAccount,
          currentCount: result.currentCount,
          dailyLimit: result.dailyLimit,
          hoursUntilReset: result.hoursUntilReset,
          resetTime: result.resetTime
        });
        setLoading(false);
        setCurrentStep(0);
        setStepStatuses({});
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error: ${response.status}`);
      }

      console.log('Token creation successful:', result);

      setTokenData(result.token);
      setWalletData(result.wallet);
      setSuccess(true);
      
      // Clear form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        image: null,
        twitter: '',
        telegram: '',
        website: '',
      });
      setPreviewImage('');

    } catch (err) {
      console.error('Token creation error:', err);
      setError(err.message || 'An error occurred while creating the token');
      setLoading(false);
      setCurrentStep(0);
      setStepStatuses({});
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 6000); // Keep loading state until animation completes
    }
  };

  // Test wallet API response
  const testWalletAPI = async () => {
    try {
      console.log('Testing PumpPortal wallet API...');
      const response = await fetch('/api/test-wallet');
      const result = await response.json();
      
      console.log('Test wallet API result:', result);
      
      if (result.success) {
        alert(`API Test Success!\nResponse keys: ${result.debug.keys.join(', ')}\nCheck console for details.`);
      } else {
        alert(`API Test Failed: ${result.error}\nCheck console for details.`);
      }
    } catch (error) {
      console.error('Test wallet API error:', error);
      alert('Test failed - check console for details');
    }
  };

  // Test function for localhost development
  const testToast = async () => {
    const testTokenData = {
      signature: 'test123signature',
      mint: 'test-mint-address',
      metadataUri: 'https://example.com/metadata.json',
      tokenName: 'Test Token',
      tokenSymbol: 'TEST',
      rawResponse: { test: 'data' }
    };

    const testWalletData = {
      publicKey: 'test-wallet-public-key',
      fundingSignature: 'test-funding-signature'
    };
    
    setTokenData(testTokenData);
    setWalletData(testWalletData);
    setLoading(true);
    simulateProgress();
    
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 6000);
  };

  // Test rate limit error (IP-based)
  const testRateLimit = () => {
    setRateLimitError({
      message: "Rate limit exceeded. You can create another token in 5 minutes.",
      remainingMinutes: 5,
      lastCreation: new Date().toISOString(),
      rateLimitType: 'ip'
    });
  };

  // Test fee account rate limit error
  const testFeeAccountRateLimit = () => {
    setRateLimitError({
      message: "Daily limit exceeded for @testaccount. This account has created 2/2 tokens today. Try again in 8 hours.",
      rateLimitType: 'feeAccount',
      feeAccount: '@testaccount',
      currentCount: 2,
      dailyLimit: 2,
      hoursUntilReset: 8,
      resetTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    });
  };

  const resetForm = () => {
    setSuccess(false);
    setError('');
    setRateLimitError(null);
    setTokenData(null);
    setWalletData(null);
    setCurrentStep(0);
    setStepStatuses({});
  };

  const getStepIcon = (step, index) => {
    const status = stepStatuses[step.id];
    const isActive = index === currentStep;
    
    if (status === 'complete') {
      return <FaCheck className="text-green-500" />;
    } else if (status === 'loading' || isActive) {
      return <FaSpinner className="text-blue-500 animate-spin" />;
    } else {
      return <span className="text-gray-400">{step.icon}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#15161B] p-4 flex items-center">
      <div className='absolute bottom-3 -translate-x-1/2 left-1/2 text-gray-500 hidden md:flex justify-center items-center'>
        powered by <a href="https://pump.fun/board"><img src="pill.png" className='w-12' alt="Pump.fun" /></a>
      </div>

      {/* Rate Limit Error Toast */}
      <AnimatePresence>
        {rateLimitError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`${getRateLimitDisplayInfo(rateLimitError).bgColor} text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 max-w-lg`}>
              {getRateLimitDisplayInfo(rateLimitError).icon}
              <div className="flex-1">
                <span className="font-semibold block text-sm">
                  {getRateLimitDisplayInfo(rateLimitError).title}
                </span>
                <span className="text-xs opacity-90">
                  {getRateLimitDisplayInfo(rateLimitError).timeInfo}
                </span>
                {rateLimitError.rateLimitType === 'feeAccount' && (
                  <div className="text-xs opacity-75 mt-1">
                    Account: {rateLimitError.feeAccount} ({rateLimitError.currentCount}/{rateLimitError.dailyLimit} daily)
                  </div>
                )}
              </div>
              <button
                onClick={() => setRateLimitError(null)}
                className="text-white hover:text-gray-200 text-lg font-bold ml-2"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress and Success Toast */}
      <AnimatePresence>
        {(loading || success) && !rateLimitError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3"
                >
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-[#67D682]"></div>
                  <span className="font-semibold">
                    {steps[currentStep]?.label || 'Processing...'}
                  </span>
                </motion.div>
              )}
              
              {success && tokenData && !loading && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3"
                >
                  <FaCheck />
                  <span className="font-semibold">
                    {tokenData.tokenName} ({tokenData.tokenSymbol}) created!
                  </span>
                  {tokenData.mint && tokenData.mint !== 'Unknown' && (
                    <a
                      href={isDevelopment ? 'https://pump.fun/board' : `https://pump.fun/${tokenData.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-green-500 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setLoading(false);
                      resetForm();
                    }}
                    className="text-white hover:text-gray-200 text-lg font-bold"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-xl mx-auto">
        <Link
          href="/"
          className="absolute top-[3%] left-[3%] px-4 py-2 text-gray-500"
        >
          <IoMdArrowRoundBack size={30} />
        </Link>

        <div className="bg-[#15161B] md:border md:border-[#2F3036] rounded-2xl p-8 mt-[7.5%]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
              <span className="text-red-600 font-semibold mr-2">!</span>
              <div className="flex-1">
                <span className="text-red-700 block">{error}</span>
                <div className="mt-2">
                  <button 
                    onClick={() => console.log('Current form data:', formData)}
                    className="text-red-600 underline text-sm"
                  >
                    Log form data to console
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Image and Name/Ticker split layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image section - left half */}
              <div>
                <label className="block text-gray-400 font-semibold mb-2">Image*</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-37 border-2 border-dashed border-[#2F3036] rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-[#24252B]"
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    ) : (
                      <>
                        <div className="w-8 h-8 border border-[#2F3036] rounded mb-2 md:mb-0 flex items-center justify-center text-white text-sm">+</div>
                        <span className="text-gray-500">Click to upload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Name and Ticker stacked - right half */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-2">Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Yield"
                    required
                    className="w-full bg-[#24252B] border border-[#2F3036] rounded-lg px-4 py-3 text-gray-500 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-2">Ticker*</label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="APY"
                    required
                    maxLength="10"
                    className="w-full bg-[#24252B] border border-[#2F3036] rounded-lg px-4 py-3 text-gray-500 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="about this token..."
                rows={1}
                maxLength="500"
                className="w-full bg-[#24252B] border border-[#2F3036] rounded-lg px-4 py-3 text-gray-500 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 hidden">{formData.description.length}/500 characters</p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowLinks(!showLinks)}
                className="flex items-center justify-between w-full py-1 text-gray-400 font-semibold"
              >
                <span>Social Links (Optional)</span>
                <motion.div
                  animate={{ rotate: showLinks ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaChevronDown />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showLinks && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="py-2 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 font-medium mb-2">X/Twitter</label>
                          <input
                            type="url"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleInputChange}
                            placeholder="https://x.com/..."
                            className="w-full bg-[#24252B] border border-[#2F3036] rounded-lg px-3 py-2 text-gray-400 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-400 font-medium mb-2">Website</label>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            placeholder="https://..."
                            className="w-full bg-[#24252B] border border-[#2F3036] rounded-lg px-3 py-2 text-gray-400 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">saved for token page</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={createPumpToken}
              disabled={loading || !formData.name || !formData.symbol || rateLimitError}
              className="w-full bg-[#67D682] text-white py-4 px-6 rounded-lg font-bold text-lg transform hover:scale-[101%] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 mr-2 border-2 border-gray-300 border-t-[#67D682]"></div>
                  Creating...
                </>
              ) : rateLimitError ? (
                <>
                  <FaClock className="mr-2" />
                  {rateLimitError.rateLimitType === 'feeAccount' ? 
                    `Account Limited (${rateLimitError.hoursUntilReset}h)` : 
                    `Rate Limited (${rateLimitError.remainingMinutes}m)`
                  }
                </>
              ) : (
                'Create'
              )}
            </button>

            {/* Test buttons for development */}
            {isDevelopment && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={testToast}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Test Progress Toast (Dev Only)
                </button>
                <button
                  type="button"
                  onClick={testRateLimit}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Test IP Rate Limit Error (Dev Only)
                </button>
                <button
                  type="button"
                  onClick={testFeeAccountRateLimit}
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Test Fee Account Rate Limit (Dev Only)
                </button>
                <button
                  type="button"
                  onClick={testWalletAPI}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Test PumpPortal Wallet API (Dev Only)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpTokenCreator;