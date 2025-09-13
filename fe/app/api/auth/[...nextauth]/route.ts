import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: (profile as any).picture,
          given_name: (profile as any).given_name,
          family_name: (profile as any).family_name,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google") {
        token.provider = "google";
      }
      if (profile && typeof profile === "object") {
        const p: any = profile;
        token.given_name = p.given_name;
        token.family_name = p.family_name;
        token.picture = p.picture;
      }
      if ((user as any)?.image && !token.picture) {
        token.picture = (user as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).given_name = (token as any).given_name;
        (session.user as any).family_name = (token as any).family_name;
        session.user.image = (token as any).picture || session.user.image || undefined;
        (session as any).provider = (token as any).provider || "google";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };


