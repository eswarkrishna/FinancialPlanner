interface AlertCalloutProps {
  title?: string;
  messages: string[];
  tone?: "warning" | "danger" | "info";
}

export function AlertCallout({
  title = "Warnings",
  messages,
  tone = "warning",
}: AlertCalloutProps) {
  if (messages.length === 0) return null;

  return (
    <div className={`alert-callout alert-callout--${tone}`} role="alert">
      <p className="alert-callout-title">{title}</p>
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
