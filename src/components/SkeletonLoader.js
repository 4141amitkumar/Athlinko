import React from 'react';
import './SkeletonLoader.css';

const PostSkeleton = () => (
    <div className="skeleton-card">
        <div className="skeleton-header">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-user-info">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-subtitle"></div>
            </div>
        </div>
        <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-short"></div>
        </div>
        <div className="skeleton-actions">
            <div className="skeleton-line skeleton-button"></div>
            <div className="skeleton-line skeleton-button"></div>
            <div className="skeleton-line skeleton-button"></div>
        </div>
    </div>
);

const ProfileSkeleton = () => (
    <div className="skeleton-profile-container">
        <div className="skeleton-profile-banner"></div>
        <div className="skeleton-profile-header">
            <div className="skeleton-profile-avatar"></div>
            <div className="skeleton-line skeleton-name"></div>
            <div className="skeleton-line skeleton-meta"></div>
        </div>
        <div className="skeleton-profile-body">
            <div className="skeleton-line skeleton-full"></div>
            <div className="skeleton-line skeleton-full"></div>
            <div className="skeleton-line skeleton-full short"></div>
        </div>
    </div>
);

const SkeletonLoader = ({ type }) => {
    if (type === 'profile') {
        return <ProfileSkeleton />;
    }

    if (type === 'feed') {
        return (
            <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </>
        );
    }
    
    return <PostSkeleton />;
};

export default SkeletonLoader;