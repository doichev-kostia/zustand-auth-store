import { useAccessTokenData, useActions } from './auth-store';

const useToken = () => {
    const data = useAccessTokenData();

    return data;
};

// random token from jwt.io
const TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNWY1YTkyMi0yZWYyLTRmYTItYjBlNi0zNjAyY2UyM2QyZjMiLCJyb2xlcyI6WyJhZG1pbiJdLCJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.xq9_VH1YUEsDkgFaA7wQTKHM2X6ER_AerxJppo9RWZY';

export function App() {
    const actions = useActions();

    const handleClick = () => {
        actions.setAccessToken(TOKEN);
    };

    const data = useToken();

    return (
        <>
            <p>Zustand auth store </p>
            <button onClick={handleClick}>Add token</button>
            <p> Token data </p>
            <pre>{JSON.stringify(data, null, 4)}</pre>
        </>
    );
}
