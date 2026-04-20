import { useState } from 'react';
import Modal from '../components/Modal';
import { trpc } from '@/utils/trpc';
export default function Home() {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState('');
  const createPost = trpc.discussions.createPost.useMutation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <h1 className="text-3xl font-bold text-white">Home</h1>
      <p className="text-zinc-400">
        This is the home page, the main landing page for the Nonprofit
        Management Institute. Other pages are accessible currently by using
        /signup or /login and any unknown routes will be redirected to the 404
        page.
      </p>
      <div>
        <button
          className="w-[228px] h-[44px] rounded-full py-[10px] px-[50px] gap-[10px] opacity-100"
          onClick={() => setOpen(true)}
        >
          Make a Post
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div>
          <p>
            Discussion
          </p>
          <input
            type="text"
            value = {value}
            onChange = {(e) => setValue(e.target.value)}
          >
            Type your discussion here
          </input>
          <button
            onClick={() => createPost.mutate({
              value,
              module_id: 1,
              cohort_id: 1,
              parent_post_id: null,
            })}
          >
            Post
          </button>
          <button
            className="w-[228px] h-[44px] rounded-full py-[10px] px-[50px] gap-[10px] opacity-100"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
      
      </div>
    </div>
  );
}
