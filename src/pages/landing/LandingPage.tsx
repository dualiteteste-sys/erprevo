import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/landing/Header';
import Hero from '../../components/landing/Hero';
import Features from '../../components/landing/Features';
import Pricing from '../../components/landing/Pricing';
import FAQ from '../../components/landing/FAQ';
import Footer from '../../components/landing/Footer';
import { OnboardingIntent } from '@/types/onboarding';
import { useAuth } from '@/contexts/AuthProvider';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, supabase } = useAuth();

  const handleSignUpClick = async (intent: OnboardingIntent) => {
    if (user) {
        await supabase.auth.updateUser({ data: { onboardingIntent: intent } });
        navigate('/app'); // or to a specific page
    } else {
        // Store intent in session storage to be picked up by the signup page
        sessionStorage.setItem('onboardingIntent', JSON.stringify(intent));
        navigate('/auth/signup');
    }
  };

  return (
    <div className="bg-white">
      <Header onLoginClick={() => navigate('/auth/login')} />
      <main>
        <Hero />
        <Pricing onSignUpClick={handleSignUpClick} />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
