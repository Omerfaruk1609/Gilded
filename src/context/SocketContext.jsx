import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/apiConfig';
import toast from 'react-hot-toast';

const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(JSON.parse(localStorage.getItem('user') || 'null'));
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    if (!user || !user.email) {
      return;
    }

    const newSocket = io(API_BASE_URL, {
      auth: {
        token: user.token
      }
    });

    newSocket.emit('join');

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

    newSocket.on('connect', () => {
      setSocket(newSocket);
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
