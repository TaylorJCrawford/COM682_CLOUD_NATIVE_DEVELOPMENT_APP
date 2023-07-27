import React from 'react'
import { useParams, Link} from 'react-router-dom'

const Message = () => {

    const {message, clipid} = useParams();
    // console.log(clipid)
  return (
    <div className='container_main message'>
        { clipid == undefined ?
            <>
                <h4 style={{color: 'White'}}>{message}, Please Click Here To Return To Main Menu.</h4>
                <Link to="/">
                    <button className="btn btn-outline-success" type='' style={{color: "white"}}>Back To Home</button>
                </Link>
            </>
            :
            <>
            <h4 style={{color: 'White'}}>{message}, Please Click Here To Return To The Clip.</h4>
            <Link to={"/video/" + clipid} >
                <button className="btn btn-outline-success" type='' style={{color: "white"}}>Go To Clip</button>
            </Link>
            </>
        }
    </div>
  )
}

export default Message
