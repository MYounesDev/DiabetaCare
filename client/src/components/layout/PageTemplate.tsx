import SideBar from '@/components/layout/SideBar';
import NavBar from '@/components/layout/NavBar';

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
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Sticky NavBar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'white',
        }}>
          <NavBar />
        </div>

        {/* Scrollable Content */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageTemplate;
