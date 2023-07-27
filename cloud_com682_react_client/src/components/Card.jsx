import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const Card = ({id, img, title, age_rating, user_id}) => {

  const { user, isAuthenticated } = useAuth0();

  return (
    <div className="card" style={{width: '18rem'}}>
    <a href={"/video/" + id}>
      <img className="card-img-top" src={img} alt="Card image cap"/>
    </a>
        <div className="card-body">
            <h5 className="card-title">{title}</h5>
            <p className="card-text">{age_rating}+</p>
            <a href={"/video/" + id} className="btn btn-primary" style={{marginRight: "5px"}}>Watch Now</a>
            { isAuthenticated == true ?
              <>
                {user_id == user['sub'] ?
                  <>
                    <a href={"/edit/" + id} className="btn btn-success" style={{marginRight: "5px"}}>Edit</a>
                    <a href={"/video/delete/" + id} className="btn btn-danger">Delete</a>
                  </>
                :
                  <></>
                }
              </>
              :
              <></>
            }
        </div>
    </div>
  )
}

export default Card