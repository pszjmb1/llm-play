export type Message = 
  | { error: string }
  | { success: string }
  | { message: string }
  | null;  // Add null to handle initial state

export function FormMessage({ message }: { message: Message }) {
  if (!message) return null;  

  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-sm">
      {'success' in message && (
        <div className="rounded-md bg-green-50 p-4 text-green-700 border-l-4 border-green-400">
            {message.success}
        </div>
      )}
      {'error' in message && (
        <div className="rounded-md bg-red-50 p-4 text-red-700 border-l-4 border-red-400">
            {message.error}
        </div>
      )}
      {'message' in message && (
        <div className="rounded-md bg-blue-50 p-4 text-blue-700 border-l-4 border-blue-400">
            {message.message}
        </div>
      )}
    </div>
  );
}
