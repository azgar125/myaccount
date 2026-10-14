import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const user = await login(values.email, values.password);
      toast.success(`Welcome, ${user.name}`);

      // 🔑 Admin vs Client redirect
      const role = String(user?.role || '').toUpperCase();
      const fallback = role === 'ADMIN' 
        ? '/admin/dashboard' 
        : '/client/dashboard';

      const from = location.state?.from?.pathname;
      navigate(from || fallback, { replace: true });
    } catch (e) {
      const msg = e.response?.data?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg">
            <LogIn size={26} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Client Accounting System</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="input pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-danger-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pl-9"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-danger-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
            <p className="font-medium mb-1">Demo credentials:</p>
            <p>Admin: <code className="bg-slate-100 px-1.5 py-0.5 rounded">admin@example.com</code> / <code className="bg-slate-100 px-1.5 py-0.5 rounded">ChangeMe123!</code></p>
            <p className="mt-1">Client: <code className="bg-slate-100 px-1.5 py-0.5 rounded">foysal@client.test</code> / <code className="bg-slate-100 px-1.5 py-0.5 rounded">Client123!</code></p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Client Accounting System
        </p>
      </div>
    </div>
  );
}

// import { useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import toast from 'react-hot-toast';
// import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';

// const schema = z.object({
//   email:    z.string().min(1, 'Email is required').email('Invalid email'),
//   password: z.string().min(1, 'Password is required'),
// });

// export default function Login() {
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // 👁️ Password visibility toggle
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm({ resolver: zodResolver(schema) });

//   const onSubmit = async (values) => {
//     try {
//       const user = await login(values.email, values.password);
//       toast.success(`Welcome, ${user.name}`);

//       // 🔑 Admin vs Client redirect
//       const role = String(user?.role || '').toUpperCase();
//       const fallback = role === 'ADMIN'
//         ? '/admin/dashboard'
//         : '/client/dashboard';

//       const from = location.state?.from?.pathname;
//       navigate(from || fallback, { replace: true });
//     } catch (e) {
//       const msg = e.response?.data?.message || 'Login failed';
//       toast.error(msg);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="mx-auto h-14 w-14 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg">
//             <LogIn size={26} />
//           </div>
//           <h1 className="mt-4 text-2xl font-bold text-slate-900">Client Accounting System</h1>
//           <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
//         </div>

//         <div className="card p-6 sm:p-8">
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
//             <div>
//               <label htmlFor="email" className="label">Email</label>
//               <div className="relative">
//                 <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   id="email"
//                   type="email"
//                   autoComplete="email"
//                   placeholder="admin@example.com"
//                   className="input pl-9"
//                   {...register('email')}
//                 />
//               </div>
//               {errors.email && (
//                 <p className="text-xs text-danger-600 mt-1">{errors.email.message}</p>
//               )}
//             </div>

//             <div>
//               <label htmlFor="password" className="label">Password</label>
//               <div className="relative">
//                 <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   id="password"
//                   type={showPassword ? 'text' : 'password'}
//                   autoComplete="current-password"
//                   placeholder="••••••••"
//                   className="input pl-9 pr-10"
//                   {...register('password')}
//                 />
//                 {/* 👁️ Show/Hide toggle */}
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((v) => !v)}
//                   aria-label={showPassword ? 'Hide password' : 'Show password'}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
//                   tabIndex={-1}
//                 >
//                   {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="text-xs text-danger-600 mt-1">{errors.password.message}</p>
//               )}
//             </div>

//             <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
//               {isSubmitting ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   Signing in...
//                 </>
//               ) : (
//                 <>
//                   <LogIn size={16} />
//                   Sign in
//                 </>
//               )}
//             </button>
//           </form>
//         </div>

//         <p className="text-center text-xs text-slate-400 mt-6">
//           © {new Date().getFullYear()} Client Accounting System
//         </p>
//       </div>
//     </div>
//   );
// }




// import { useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import toast from 'react-hot-toast';
// import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';

// const schema = z.object({
//   email: z.string().min(1, 'Email is required').email('Invalid email'),
//   password: z.string().min(1, 'Password is required'),
// });

// export default function Login() {
//   const { login, isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm({ resolver: zodResolver(schema) });

//   const onSubmit = async (values) => {
//     try {
//       const user = await login(values.email, values.password);
//       toast.success(`Welcome, ${user.name}`);

//       const from = location.state?.from?.pathname;
//       const fallback = user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard';
//       navigate(from || fallback, { replace: true });
//     } catch (e) {
//       const msg = e.response?.data?.message || 'Login failed';
//       toast.error(msg);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
//       <div className="w-full max-w-md">
//         {/* Logo / Title */}
//         <div className="text-center mb-8">
//           <div className="mx-auto h-14 w-14 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg">
//             <LogIn size={26} />
//           </div>
//           <h1 className="mt-4 text-2xl font-bold text-slate-900">Valixoo Client Accounting System</h1>
//           <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
//         </div>

//         {/* Card */}
//         <div className="card p-6 sm:p-8">
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
//             <div>
//               <label htmlFor="email" className="label">Email</label>
//               <div className="relative">
//                 <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   id="email"
//                   type="email"
//                   autoComplete="email"
//                   placeholder="admin@example.com"
//                   className="input pl-9"
//                   {...register('email')}
//                 />
//               </div>
//               {errors.email && (
//                 <p className="text-xs text-danger-600 mt-1">{errors.email.message}</p>
//               )}
//             </div>

//             <div>
//               <label htmlFor="password" className="label">Password</label>
//               <div className="relative">
//                 <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   id="password"
//                   type="password"
//                   autoComplete="current-password"
//                   placeholder="••••••••"
//                   className="input pl-9"
//                   {...register('password')}
//                 />
//               </div>
//               {errors.password && (
//                 <p className="text-xs text-danger-600 mt-1">{errors.password.message}</p>
//               )}
//             </div>

//             <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
//               {isSubmitting ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   Signing in...
//                 </>
//               ) : (
//                 <>
//                   <LogIn size={16} />
//                   Sign in
//                 </>
//               )}
//             </button>
//           </form>

//           <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
//             <p className="font-medium mb-1">Demo credentials:</p>
//             <p>Admin: <code className="bg-slate-100 px-1.5 py-0.5 rounded">admin@example.com</code> / <code className="bg-slate-100 px-1.5 py-0.5 rounded">ChangeMe123!</code></p>
//             <p className="mt-1">Client: <code className="bg-slate-100 px-1.5 py-0.5 rounded">foysal@client.test</code> / <code className="bg-slate-100 px-1.5 py-0.5 rounded">Client123!</code></p>
//           </div>
//         </div>

//         <p className="text-center text-xs text-slate-400 mt-6">
//           © {new Date().getFullYear()} Client Accounting System
//         </p>
//       </div>
//     </div>
//   );
// }