import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { add_comment } from '../Operations_Classes/Comment_Class';
import { useAuth0 } from '@auth0/auth0-react'

const CommentForm = ({title}) => {

    const {id} = useParams()
    const navigate = useNavigate();

  function SendSubmit(clip_id, user_id) {

    add_comment(document, clip_id, user_id)
    navigate('/message/New Comment Added/' + clip_id);

  }

  const { user, isAuthenticated } = useAuth0();
  let user_id = user['sub']

  return (
    <div className='container_main collection_form'>
    <div className="action">
            <button type="button" className="btn btn-primary" onClick={() => SendSubmit(id, user_id)}>Submit</button>
            <button type="button" className="btn btn-secondary">Clear Form</button>
    </div>
  <h5 style={{color: 'White'}}>{title} Comment</h5>
      <form method="post" action="/api/v1.0/clips" enctype="multipart/form-data">
      <div className="category_options">
          <div className="btn-group btn-group-toggle" data-toggle="buttons" style={{padding: "5px"}}>
            <label className="btn btn-secondary active">
              <input type="radio" name="rating" id="rating" autocomplete="off" value='1' checked /> 1 Star
            </label>
          </div>
          <div className="btn-group btn-group-toggle" data-toggle="buttons" style={{padding: "5px"}}>
            <label className="btn btn-secondary active">
              <input type="radio" name="rating" id="rating" autocomplete="off" value='2' /> 2 Star
            </label>
          </div>
          <div className="btn-group btn-group-toggle" data-toggle="buttons" style={{padding: "5px"}}>
            <label className="btn btn-secondary active">
              <input type="radio" name="rating" id="rating" autocomplete="off" value='3' /> 3 Star
            </label>
          </div>
          <div className="btn-group btn-group-toggle" data-toggle="buttons" style={{padding: "5px"}}>
            <label className="btn btn-secondary active">
              <input type="radio" name="rating" id="rating" autocomplete="off" value='4' /> 4 Star
            </label>
          </div>
          <div className="btn-group btn-group-toggle" data-toggle="buttons" style={{padding: "5px"}}>
            <label className="btn btn-secondary active">
              <input type="radio" name="rating" id="rating" autocomplete="off" value='5'/> 5 Star
            </label>
          </div>
        </div>
        <div className="form-group">
            <label for="comment">Comment</label>
            <input type="text" className="form-control" name="comment" id="comment" placeholder="Comment"/>
        </div>
        </form>
    </div>
  )
}

export default CommentForm


