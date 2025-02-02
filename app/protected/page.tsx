import { createClient } from '@/utils/supabase/server';
import { InfoIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <div className="w-full">
        <div className="flex items-center gap-3 rounded-md bg-accent p-3 px-5 text-sm text-foreground">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome back, {user.email}! You have successfully logged in.
        </div>
      </div>
      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Your User Details</h2>
        <pre className="max-h-32 overflow-auto rounded border p-3 font-mono text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="mb-4 text-2xl font-bold">Next Steps</h2>
        <p className="text-sm text-foreground">
          Explore the features of LLM-Play by visiting the following sections:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li><a href="/dashboard" className="text-primary underline">Dashboard</a> - View and manage your LLM challenges.</li>
          <li><a href="/submit" className="text-primary underline">Submit a Challenge</a> - Contribute your own reinforcement learning environment.</li>
          <li><a href="/community" className="text-primary underline">Community Discussions</a> - Engage with other contributors and share insights.</li>
        </ul>
        <form action="/sign-out" method="post">
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </div>
    </div>
  );
}
