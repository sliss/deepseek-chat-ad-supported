// import TwitterWrapped from "../components/LandingPage";

// export default function Home() {
//   return (
//     <main className="flex relative min-h-screen flex-col items-center justify-center p-4">
//       {/* background grid design texture code */}
//       <div className="absolute inset-0 -z-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_0px),linear-gradient(to_bottom,#80808012_1px,transparent_0px)] bg-[size:50px_50px]"></div>
//       <TwitterWrapped />
//     </main>
//   );
// }

'use client';

import { useChat } from 'ai/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat();

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.reasoning && <pre>{message.reasoning}</pre>}
          {message.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}