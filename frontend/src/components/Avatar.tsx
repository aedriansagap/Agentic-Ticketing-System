

interface AvatarProps {
  username: string;
  size?: number;
}

export default function Avatar({ username, size = 36 }: AvatarProps) {
  const seed = encodeURIComponent(username);
  const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=transparent`;
  
  return (
    <img 
      src={url} 
      alt={`${username} avatar`} 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        objectFit: 'cover'
      }} 
    />
  );
}
