import { React, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'

const DeleteVideo = () => {

    const [status, setStatus] = useState('Loading...');
    const {id} = useParams()
    console.log(id)

    let delete_uri = process.env.REACT_APP_FLASK_API + "clips/" + id

    console.log(delete_uri)

    useEffect(() => {
        fetch(delete_uri, {method: 'DELETE'})
          .then(res => {
            return res.json()
          })
          .then((data) => {
            console.log(data)
            console.log(data['message'])
            setStatus(data['message'] + " Status Code: " + data['status_code'] )
          })
      }, []);

  return (
    <div className='container_main'>
        <div className='message'>
            <h4 style={{color: 'White'}}>{status}</h4>
            { status != 'Loading...' ?
                <div>
                    <br></br>
                    <a href={"/"} className="btn btn-success">Return To Home Page</a>
                </div>
                :
                <br></br>
            }
        </div>
    </div>
  )
}

export default DeleteVideo