import Sidebar from '@/components/shared/sidebar';
import MobileNav from '@/components/shared/MobileNav';
import { Toaster } from '@/components/ui/sonner';

const Layout = ({children}: {children: React.ReactNode}) => {
  return (
    <main className='root'>
      <Sidebar/>
      <MobileNav/>

        <div className='root-container'>
            <div className='wrapper'>
                {children} 
            </div>
        </div>

        <Toaster position='top-right' richColors closeButton />
           
    </main>
  )
}

export default Layout;