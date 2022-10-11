import React from 'react'

function Banner(props) {
    return (
        <div className='Banner'>
            <div className='Banner-title'>
                <h1>{props.bannerText}</h1>
            </div>

        </div>
    )
}



export default Banner
