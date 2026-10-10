import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
