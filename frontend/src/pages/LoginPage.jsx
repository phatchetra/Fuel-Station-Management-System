import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="dashboard-page min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="label-brand mb-2">FUEL LEDGER</p>
          <h1 className="text-[1.625rem] font-bold">ចូលប្រើប្រាស់</h1>
          <p className="muted-text mt-1.5">បញ្ជីប្រេងសាំង</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
