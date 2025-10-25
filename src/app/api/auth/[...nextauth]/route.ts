import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    id: string;
    verified: boolean;
    role?: 'admin' | 'user';
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      verified: boolean;
      role?: 'admin' | 'user';
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    verified: boolean;
    role?: 'admin' | 'user';
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciais não fornecidas');
          return null;
        }

        try {
          console.log('🔍 Tentando autenticar:', credentials.email);
          
          const client = await pool.connect();
          const result = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [credentials.email]
          );
          client.release();

          const user = result.rows[0];
          
          if (!user || !user.password) {
            console.log('❌ Usuário não encontrado ou sem senha');
            return null;
          }

          // Em produção, evite logs sensíveis
          if (process.env.NODE_ENV !== 'production') {
            console.log('� Usuário encontrado:', user.email);
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Senha válida:', isPasswordValid);
          }

          if (!isPasswordValid) {
            console.log('❌ Senha inválida');
            return null;
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Login bem-sucedido para:', user.email);
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            verified: user.verified,
            role: user.role || 'user'
          };
        } catch (error) {
          console.error("❌ Erro durante autenticação:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.verified = user.verified;
  token.role = user.role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.verified = token.verified as boolean;
  session.user.role = (token.role as 'admin' | 'user') || 'user';
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login"
  },
  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };