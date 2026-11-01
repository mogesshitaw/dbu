import React from "react";
import Link from "next/link";

const DashFooter = () => {
  return (
    <footer className="bg-blue-700 text-white p-1 mt-8">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Debre Berhan University. All rights reserved.
        </p>
        <nav className="mt-2">
          <ul className="flex justify-center space-x-4">
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
    );
}
export default DashFooter;