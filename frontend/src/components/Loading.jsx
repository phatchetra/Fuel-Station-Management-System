/**
 * Full-page or inline loading spinner.
 */
export default function Loading({ message = "កំពុងផ្ទុក..." }) {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="text-center space-y-3">
        <div
          className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
          role="status"
          aria-label="Loading"
        />
        <p className="muted-text text-sm">{message}</p>
      </div>
    </div>
  );
}
