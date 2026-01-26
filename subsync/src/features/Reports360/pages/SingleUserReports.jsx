import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserPerformanceList from './UserPerformanceList';

const SingleUserReportHub = () => {
    const [searchParams] = useSearchParams();
    const period = searchParams.get('period') || 'monthly';
    
    return <UserPerformanceList type="individual" period={period} />;
};

export default SingleUserReportHub;
