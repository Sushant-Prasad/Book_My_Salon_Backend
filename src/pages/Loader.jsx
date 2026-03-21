import React from 'react'
import './loader.css'

const Loader = () => {
    return (
        <div className='flex flex-col items-center'>
            <div className='flex justify-center items-center w-full h-screen'>
                <div className="loader">
                    <div className="cube">
                        <div className="face front"></div>
                        <div className="face back"></div>
                        <div className="face left"></div>
                        <div className="face right"></div>
                        <div className="face top"></div>
                        <div className="face bottom"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Loader