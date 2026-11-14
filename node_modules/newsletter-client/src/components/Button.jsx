export function Button({ children, type = 'button', className = '', disabled, onClick }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton(props) {
  return <Button {...props} className="text-white bg-brand-600 hover:bg-brand-700" />;
}

export function SecondaryButton(props) {
  return <Button {...props} className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-50" />;
}

export function DangerButton(props) {
  return <Button {...props} className="text-white bg-red-600 hover:bg-red-700" />;
}
