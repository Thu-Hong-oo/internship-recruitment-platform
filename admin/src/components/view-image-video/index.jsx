import { useEffect, useRef } from "react";
import { getPath } from "../../utils";

function View(props) {
  const videoRef = useRef(null);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  useEffect(() => {
    const handleSpace = (event) => {
      if (event.key === " ") {
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handleSpace);
    return () => {
      window.removeEventListener("keydown", handleSpace);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        props.setDateView({});
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div className="relative">
      <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000000000]">
        {props?.dateView?.type === "video" ? (
          <div className="relative flex items-center justify-center w-fit h-fit">
            <video
              ref={videoRef}
              autoPlay
              autoFocus
              controls
              preload="metadata"
              crossOrigin="anonymous"
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <source
                src={props?.dateView?.mediaUrl || props?.dateView?.url}
                type="video/mp4"
              />
            </video>

            {props?.dateView?.title && (
              <>
                {props?.dateView?.views && (
                  <div className="absolute bottom-[24%] right-[1%] mb-24 max-w-[96%] opacity-0 text-sm">
                    <div className="text-center">
                      <img
                        src={getPath("/icons/common/i-view.svg")}
                        width="30"
                        className="inline-block mr-1"
                      />
                      <div className="text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                        {/* {helper.formatNumberView(props?.dateView?.views)} */}
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-[12%] max-w-[96%] max-h-[100px] overflow-y-auto cursor-pointer px-3 py-2 rounded-lg backdrop-blur-sm opacity-0 text-white text-sm drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                  <div className="font-normal">{props?.dateView?.title}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          <img
            src={props?.dateView?.mediaUrl || props?.dateView?.url}
            alt="Preview"
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          />
        )}
      </div>

      <div className="fixed top-[2%] right-[2%] z-[1000000000]">
        <img
          src={getPath("/icons/media/ic-remove.svg")}
          width="24"
          height="24"
          className="cursor-pointer"
          onClick={() => props.setDateView({})}
        />
      </div>
    </div>
  );
}

export default View;
