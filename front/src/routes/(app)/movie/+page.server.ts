// import { SECRET_BACK_URL } from '$env/static/private';
// import axios from 'axios';

// const getMovies = async (page_to_load: number) => {
//     const config = {
//         method: 'get',
//         url: `${SECRET_BACK_URL}/movies`,
//         params: {
//             limit: 10,
//             page: page_to_load
//         }
//     };
//     try {
//         const response = await axios(config);
//         console.log('response', response.data);
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching movies:', error);
//         throw error;
//     }
// };

// export const load  = async ({ params }: { params: { page: number } }) => {
//     try {
//         const movies = await getMovies(params.page)
//         return {
//             movies
//         };

//     }
//     catch (error) {
//         console.error('Error loading movies:', error);
//         throw error;
//     }
// }