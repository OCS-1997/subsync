import { Card, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { useSelector } from 'react-redux';
import SplitText from '@/components/animations/SplitText.jsx'
import Reminders from './Reminders.jsx'
import Warnings from './Warnings.jsx'

function Home() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      <Card className="bg-blue-500 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            <SplitText text={`Hello ${user.name } !`} />
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="flex flex-col gap-6">
        <Reminders />
        <Warnings />
      </div>
    </div>
  )
}

export default Home;
