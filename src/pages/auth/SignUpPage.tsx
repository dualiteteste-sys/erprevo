import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { signUpWithEmail } from '@/lib/auth';
import { useToast } from '@/contexts/ToastProvider';

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      addToast('Confirme seu e-mail para continuar.', 'success');
      navigate('/auth/pending-verification');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Crie sua conta</h2>
      <p className="text-center text-gray-600 mb-6">E comece seu teste grátis de 30 dias.</p>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="email-signup">Email</label>
          <input
            id="email-signup"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mt-1 p-3 bg-white/50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="password-signup">Senha</label>
          <input
            id="password-signup"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full mt-1 p-3 bg-white/50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Criar Conta e Iniciar Teste'}
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-600 mt-6">
        Já possui uma conta?{' '}
        <Link to="/auth/login" className="font-medium text-blue-600 hover:underline focus:outline-none">
          Faça login
        </Link>
      </p>
    </motion.div>
  );
};

export default SignUpPage;
