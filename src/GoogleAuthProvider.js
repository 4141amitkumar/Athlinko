import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = '165588625840-gip3rorr4q8bb44klbc4eakbavg8jbvn.apps.googleusercontent.com';  

const GoogleAuthProvider = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthProvider;
