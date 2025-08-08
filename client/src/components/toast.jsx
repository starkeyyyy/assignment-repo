import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { GitPullRequest, ShieldCheck } from "lucide-react";

const Toast = forwardRef((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("The PR has been created!");

  useImperativeHandle(ref, () => ({
    show(msg) {
      setMessage(msg || "The PR has been created!");
      setVisible(true);
    },
  }));

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 bg-[#49225B] text-white rounded-2xl shadow-lg text-md transition-all cursor-pointer duration-500 ease-in-out z-50
        ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-5 pointer-events-none"
        }
      `}
    >
      {message === "Creating the pull Request!!!!" ? (
        <div className="flex gap-3 items-center ">  <GitPullRequest className=" text-yellow-300" /> Creating PR!!! <div className="small-loader ml-5"></div></div>
      ) : (
        <div className="flex gap-3 items-center ">
          <ShieldCheck className="text-green-400" />
          <span>{message}</span>
          <GitPullRequest className="ml-6 text-purple-300" />
        </div>
      )}
    </div>
  );
});

export default Toast;
