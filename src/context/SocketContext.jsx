import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (user && user.email) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('join', user.email);

      newSocket.on('new_notification', (data) => {
        toast.success(data.message, {
          icon: '✨',
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#1a1a1a',
            color: '#D4AF37',
            border: '1px solid #D4AF37'
          }
        });
      });

      return () => newSocket.close();
    }
  }, [user?.email]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
