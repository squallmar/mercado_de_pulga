import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    id: string;
    verified: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      verified: boolean;
    };
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

          console.log('👤 Usuário encontrado:', user.email);
          console.log('🔐 Hash no banco:', user.password.substring(0, 20) + '...');
          console.log('🔑 Senha fornecida:', credentials.password);

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('✅ Senha válida:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Senha inválida');
            return null;
          }

          console.log('✅ Login bem-sucedido para:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            verified: user.verified
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.verified = token.verified as boolean;
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