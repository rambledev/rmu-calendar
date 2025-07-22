import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is trying to access admin pages
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token // Must be logged in
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/admin/:path*"]
}