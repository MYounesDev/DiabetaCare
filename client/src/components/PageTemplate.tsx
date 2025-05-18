import SideBar from '@/components/SideBar';

interface PageTemplateProps {
  children?: React.ReactNode;
}

const PageTemplate: React.FC<PageTemplateProps> = ({ children }) => {
  const user = localStorage.getItem('user');
  const role = user ? JSON.parse(user).role : null;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SideBar role={role} />
      <div style={{ 
        width: '100%', 
        transition: 'margin-left 0.3s ease',
        overflowY: 'auto',
        height: '100vh'
      }}>
        {children}
      </div>
    </div>
  );
};

export default PageTemplate;