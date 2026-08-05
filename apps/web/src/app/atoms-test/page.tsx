import { Button } from "@/components/atoms/button"
import { Typography } from "@/components/atoms/typography"
import { Input } from "@/components/atoms/input"
import { Checkbox } from "@/components/atoms/checkbox"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/atoms/card"
import { Badge } from "@/components/atoms/badge"
import { Separator } from "@/components/atoms/separator"
import { Logo } from "@/components/atoms/logo"

export default function AtomsTestPage() {
    return (
        <div className="p-10 space-y-10 bg-slate-50 min-h-screen">
            <div className="space-y-4">
                <Typography variant="h1" className="text-black">Atoms Verification</Typography>
                <Separator variant="thick-orange" />
            </div>

            <section className="space-y-4">
                <Typography variant="h2">Logo</Typography>
                <Logo />
            </section>

            <section className="space-y-4">
                <Typography variant="h2">Typography</Typography>
                <div className="space-y-2 border p-4 rounded bg-white">
                    <Typography variant="h1" className="text-black">Heading 1 (Hero)</Typography>
                    <Typography variant="h2">Heading 2 (Section)</Typography>
                    <Typography variant="h3">Heading 3 (Card Title)</Typography>
                    <Typography variant="p">Paragraph text with <Typography variant="highlight">highlight</Typography>.</Typography>
                    <Typography variant="label">Label Text</Typography>
                </div>
            </section>

            <section className="space-y-4">
                <Typography variant="h2">Buttons</Typography>
                <div className="flex gap-4">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button disabled>Disabled</Button>
                </div>
            </section>

            <section className="space-y-4">
                <Typography variant="h2">Badges</Typography>
                <div className="flex gap-4">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="yellow">Yellow Highlight</Badge>
                    <Badge variant="orange">Orange Highlight</Badge>
                </div>
            </section>

            <section className="space-y-4">
                <Typography variant="h2">Form Elements</Typography>
                <div className="grid max-w-sm gap-4">
                    <Input placeholder="Input field..." />
                    <div className="flex items-center gap-2">
                        <Checkbox id="terms" />
                        <label htmlFor="terms" className="text-sm font-medium">Accept terms and conditions</label>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <Typography variant="h2">Cards</Typography>
                <div className="grid grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle><Typography variant="h3">Default Card</Typography></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Typography>Content inside a default card.</Typography>
                        </CardContent>
                    </Card>

                    <Card variant="highlight-orange">
                        <CardHeader>
                            <CardTitle><Typography variant="h3">Orange Card</Typography></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Typography>Card with orange top border.</Typography>
                        </CardContent>
                    </Card>

                    <Card variant="highlight-blue">
                        <CardHeader>
                            <CardTitle><Typography variant="h3">Blue Card</Typography></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Typography>Card with blue top border.</Typography>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
}
