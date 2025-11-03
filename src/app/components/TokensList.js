"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExternalLinkAlt, FaTwitter, FaGlobe, FaSearch, FaFilter, FaSync, FaShare } from 'react-icons/fa';
import { HiSpeakerphone } from "react-icons/hi";
import { MdOutlineRefresh } from "react-icons/md";
import Link from 'next/link';

const TokensList = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [copiedAddresses, setCopiedAddresses] = useState(new Set());
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'all',
    search: ''
  });

  // Fetch tokens from API
  const fetchTokens = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/tokens?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status}`);
      }
      
      const data = await response.json();
      setTokens(data.tokens);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle copy mint address
  const handleCopyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddresses(prev => new Set([...prev, address]));
      
      // Remove from copied set after 2 seconds
      setTimeout(() => {
        setCopiedAddresses(prev => {
          const newSet = new Set(prev);
          newSet.delete(address);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Generate tweet intent URL
  const generateTweetIntent = (token) => {
    const message = `People just made a token for you`;
    const url = token.mint_address ? `https://pump.fun/${token.mint_address}` : '';

    // Append @handle at the end of the message
    const handle = token.fee_account ? ` @${token.fee_account.replace('@', '')}` : '';

    const tweetParams = new URLSearchParams({
      text: `${message}${handle}`,
      url: url
    });

    return `https://twitter.com/intent/tweet?${tweetParams.toString()}`;
  };


  // Fetch tokens when filters change
  useEffect(() => {
    fetchTokens();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'search' || key === 'status' ? 1 : prev.page // Reset to page 1 when filtering
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if token is test data
  const isTestToken = (token) => {
    return token.raw_response?.test === true || 
           token.mint_address?.startsWith('test-') ||
           token.transaction_signature?.startsWith('test-');
  };

  // Get Twitter profile image URL using unavatar.io
  const getTwitterProfileImage = (username) => {
    if (!username) return null;
    // Remove @ symbol if present
    const cleanUsername = username.replace('@', '');
    return `https://unavatar.io/twitter/${cleanUsername}`;
  };

  // Skeleton token component
  const SkeletonToken = () => (
    <div className="relative bg-[#15161B] border border-[#2F3036] rounded-lg p-4 w-full animate-pulse">
      <div className="flex items-start gap-4">
        {/* Skeleton Token Image - Left Side */}
        <div className="flex-shrink-0">
          <div className="size-32 rounded-lg bg-gray-600"></div>
        </div>

        {/* Skeleton Token Info - Right Side */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Name, Symbol, Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 bg-gray-600 rounded w-24"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            </div>

            {/* Skeleton Pump.fun Link */}
            <div className="flex-shrink-0">
              <div className="w-7 h-7 bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* Skeleton Description */}
          <div className="space-y-1 mb-2">
            <div className="h-2 bg-gray-700 rounded w-full"></div>
            <div className="h-2 bg-gray-700 rounded w-3/4"></div>
          </div>

          {/* Skeleton Mint Address and Twitter Profile - absolute bottom right */}
          <div className="absolute bottom-2 right-2 flex flex-col items-end gap-[2px]">     
            {/* Skeleton Fee Account Link */}
            <div className="flex items-center gap-1 bg-gray-600 py-1 px-2 rounded-md">
              <div className="size-5 rounded-full bg-gray-700"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Search and Filters - Always Visible */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {/* Search - 50% on mobile, 40% on desktop */}
        <div className="relative w-[50%] md:w-[40%]">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full bg-[#24252B] border border-[#2F3036] rounded-lg pl-10 pr-4 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Refresh Button - 10% on mobile, 5% on desktop */}
        <button
          onClick={fetchTokens}
          disabled={loading}
          className="w-[10%] md:w-min bg-[#15161B] text-white px-1 py-3 rounded-lg font-medium flex items-center justify-center cursor-pointer"
        >
          <MdOutlineRefresh className={`text-xl ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Tokens List */}
      <div className="space-y-4">
        {loading ? (
          // Show skeleton tokens while loading
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center mx-[5%] xl:mx-[10%]'>
            {[...Array(9)].map((_, index) => (
              <SkeletonToken key={`skeleton-${index}`} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center mx-[5%] xl:mx-[10%]'>
              {tokens.map((token) => (
                // Fixed version of your token card component
                <Link key={token.id} href={`/${token.mint_address}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 0 }}
                    className={`relative bg-[#15161B] border border-[#2F3036] rounded-lg p-4 hover:border-gray-500 transition-colors w-full cursor-pointer ${
                      isTestToken(token) ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Token Image - Left Side */}
                      <div className="flex-shrink-0">
                        {token.image_uri ? (
                          <img
                            src={token.image_uri}
                            alt={`${token.name} logo`}
                            className="size-32 rounded-lg object-cover bg-[#24252B] border border-[#2F3036]"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzI0MjUyQiIvPgo8cGF0aCBkPSJNMzIgMjBMMzggMzJIMjZMMzIgMjBaIiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik0zMiA0NEwyNiAzMkgzOEwzMiA0NFoiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          // Placeholder when no image
                          <div className="size-32 rounded-lg bg-[#24252B] border border-[#2F3036] flex items-center justify-center">
                            <div className="text-gray-500 text-xs font-mono">
                              {token.symbol ? token.symbol.slice(0, 3).toUpperCase() : '?'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Token Info - Right Side */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Name, Symbol, Status */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white truncate">
                                  {token.name}
                                </h3>
                                {isTestToken(token) && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    TEST
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                ({token.symbol})
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#24252B] text-[#FAFAFA] border border-[#2F3036] hidden">
                              {token.status}
                            </span>
                          </div>

                          {/* Pump.fun Link */}
                          {token.mint_address && !isTestToken(token) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(`https://pump.fun/${token.mint_address}`, '_blank', 'noopener,noreferrer');
                              }}
                              className="flex-shrink-0 cursor-pointer hover:scale-[105%] transition ease-in-out duration-150"
                              title="View on Pump.fun"
                            >
                              <img src="/pill.png" className='w-7 h-7'/>
                            </button>
                          )}
                        </div>

                        {/* Description */}
                        {token.description && (
                          <p className="text-gray-400 text-[10px] mb-2 line-clamp-2">
                            {token.description}
                          </p>
                        )}

                        {/* Mint Address and Twitter Profile - absolute bottom right */}
                        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-[2px]">
                          {/* Mint Address with Copy Button */}
                          {token.mint_address && (
                            <div className="flex items-center space-x-[1px]">
                              <span className="text-gray-500 text-[8px]">
                                {token.mint_address.slice(0, 3)}...{token.mint_address.slice(-4)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCopyAddress(token.mint_address);
                                }}
                                className="w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity"
                                title="Copy mint address"
                              >
                                {copiedAddresses.has(token.mint_address) ? (
                                  <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="size-[10px] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                          
                          {/* Tweet Intent Button and Fee Account Link with Twitter Profile Photo */}
                          {token.fee_account && (
                            <div className="items-center gap-1 hidden">
                              {/* Tweet Intent Button with Speaker Icon */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(generateTweetIntent(token), '_blank', 'noopener,noreferrer');
                                }}
                                className="flex items-center justify-center text-white py-1 px-1 hover:opacity-75 transition-opacity cursor-pointer"
                                title="Tweet about this token"
                              >
                                <FaShare className='text-sm text-gray-300'/>
                              </button>
                              
                              {/* Fee Account Link */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://x.com/${token.fee_account}`, '_blank', 'noopener,noreferrer');
                                }}
                                className="flex items-center gap-1 text-white bg-black py-1 px-2 rounded-md text-xs hover:bg-gray-800 transition-colors cursor-pointer"
                                title={`View @${token.fee_account} on Twitter`}
                              >
                                {getTwitterProfileImage(token.fee_account) && (
                                  <img
                                    src={getTwitterProfileImage(token.fee_account)}
                                    alt={`${token.fee_account} profile`}
                                    className="size-5 rounded-full border border-gray-600 hidden"
                                    onLoad={(e) => {
                                    }}
                                    onError={async (e) => {
                                      console.log(`❌ Avatar failed to load for ${token.fee_account}:`, e.target.src);
                                      
                                      try {
                                        const response = await fetch(e.target.src, { method: 'GET' });
                                        console.log('Response Headers:');
                                        response.headers.forEach((value, key) => {
                                          console.log(`${key}: ${value}`);
                                        });

                                        const text = await response.text();
                                        console.log('Response Body:', text);
                                      } catch (fetchError) {
                                        console.log('Fetch Error:', fetchError);
                                      }

                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span>{token.fee_account}</span>
                                <div className='text-lg'>
                                  𝕏
                                </div>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Hidden Social Links */}
                        <div className="gap-1 hidden">
                          {token.twitter_url && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(token.twitter_url, '_blank', 'noopener,noreferrer');
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded text-xs transition-colors"
                            >
                              <FaTwitter />
                            </button>
                          )}
                          {token.website_url && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(token.website_url, '_blank', 'noopener,noreferrer');
                              }}
                              className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-xs transition-colors"
                            >
                              <FaGlobe />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {tokens.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No tokens found</div>
            <div className="text-gray-500 text-sm">
              {filters.search || filters.status !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first token to see it here'}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2F3036]">
          <div className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="bg-[#2F3036] disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="bg-[#2F3036] disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokensList;