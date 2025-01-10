import { motion, AnimatePresence,usePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function Modal({ children, onClose, isOpen, modalLayer }) {
  const [shouldRender, setShouldRender] = useState(false); 
  const closeLayerRef = useRef<any>();
  const router = useRouter();
  let isClicked = false;

 // 라우터 변경 감지
 useEffect(() => {
  const handleRouteChange = () => {
    if (shouldRender) {
      setShouldRender(false);
    }
  };

  const handlePopState = () => {
    if (shouldRender) {
      setShouldRender(false);
    }
  };

  window.addEventListener('popstate', handlePopState);
  router.events.on('routeChangeStart', handleRouteChange);

  return () => {
    window.removeEventListener('popstate', handlePopState);
    router.events.off('routeChangeStart', handleRouteChange);
  };
}, [router, shouldRender]);



  useEffect(() => {
    if (isOpen) {
      setShouldRender(true); 
    }
  }, [isOpen]);

  const handleClose = () => {
    setShouldRender(false); 
    router.push('/', undefined, { scroll: false });  
    closeLayerRef.current.classList.add('hidden')
    document.body.removeAttribute("style");
  };
  

  const handleExitComplete = () => {
    setShouldRender(false);   
  }; 
 
  
  return (
    <> 
    {/* <div className='fixed top-0 left-0 w-[30px] h-[30px] bg-[red]'></div> */}
    <div 
            ref={closeLayerRef} 
            className={`fixed inset-0 duration-[250ms] z-[9999] pointer-events-none`}
            onClick={handleClose} 
          />
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete = {()=>{
            closeLayerRef.current.classList.remove('pointer-events-none')
          }}
          className="tempClass fixed w-full z-[9999] overflow-y-auto top-[10%] h-[90%]"
        >
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            style={{
              position: 'fixed',
              top: '0',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}
            className="relative overflow-auto bg-black"
            data-body-scroll-lock-ignore
          >
            <div className="absolute top-[10px] right-[10px] lg:right-4 lg:top-4 z-50">
              <button
                onClick={handleClose} 
                className="text-white font-IBMPlexMono text-[11px] lg:text-base hover:opacity-75"
              >
                CLOSE&nbsp;[&nbsp;X&nbsp;]
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}