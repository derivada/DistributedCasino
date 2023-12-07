import { Link } from 'react-router-dom';

const ErrorPage = () => {
    return (
        <div>
            <h1>Seems like you entered a wrong URL,  o back to the mainpage so you can continue to ruin your future</h1>
            <Link to="/">Go back</Link>
        </div>
    );
}

export default ErrorPage;