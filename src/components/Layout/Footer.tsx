const FooterNote = () => (
  <div className="text-xs">
    <p>© 2025 by Ritzy Mist</p>
  </div>
)

const Footer = () => (
  <footer className="relative z-10 w-full min-h-[14rem] bg-black leading-7 text-white border-t-2 border-white">
    <div className="max-w-full-content mx-auto sm:flex gap-2 pt-10 pb-16">
      <div className="flex-1">
        <div className="px-6 sm:pr-0">
          <div className="w-9 h-0.5 bg-white mb-3"></div>
          <p className="font-lulo mb-8">Contact Info</p>
          <div className="text-sm tracking-wide space-y-4 mb-8">
            <p className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <a href="sms:916-628-4899">916-628-4899</a>
            </p>
            <p className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <a href="mailto:theritzymist@gmail.com" target="_self" className="hover:underline">
                theritzymist@gmail.com
              </a>
            </p>
            <p className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <a href="https://instagram.com/theritzymist" target="_blank" rel="noreferrer" className="hover:underline">
                theritzymist
              </a>
            </p>
          </div>
          <FooterNote />
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
