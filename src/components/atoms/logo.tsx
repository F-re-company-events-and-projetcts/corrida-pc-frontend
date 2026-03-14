import Link from "next/link"
import React from "react"

export const Logo = () => {
    return (
        <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center text-white font-bold">
                ICON
            </div>
            <span className="font-bold text-lg text-primary uppercase">
                2ª Corrida PC
            </span>
        </Link>
    )
}
