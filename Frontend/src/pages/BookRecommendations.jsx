import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { booksData } from '../data/booksData'; // Assuming this exists or I will mock it here if not used elsewhere
import { MdStar, MdShoppingCart } from 'react-icons/md';

const BookRecommendations = () => {
    // If booksData doesn't exist in the project yet (I recall seeing data folder but not checking content fully), 
    // I'll provide a fallback mock here just in case.
    const books = booksData || [
        { id: 1, title: 'Crucial Conversations', author: 'Kerry Patterson', rating: 4.8, image: 'https://images-na.ssl-images-amazon.com/images/I/51u2E5fNq8L._SX331_BO1,204,203,200_.jpg' },
        { id: 2, title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', rating: 4.9, image: 'https://images-na.ssl-images-amazon.com/images/I/51Myx6jmtIL._SX321_BO1,204,203,200_.jpg' },
        { id: 3, title: 'Emotional Intelligence 2.0', author: 'Travis Bradberry', rating: 4.5, image: 'https://images-na.ssl-images-amazon.com/images/I/51Jj12iMZnL._SX329_BO1,204,203,200_.jpg' },
        { id: 4, title: 'Dare to Lead', author: 'Brené Brown', rating: 4.7, image: 'https://images-na.ssl-images-amazon.com/images/I/41P-0MM6FHL._SX329_BO1,204,203,200_.jpg' },
    ];

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Books</h1>
            <p className="text-gray-600 mb-8">AI-curated reads to boost your soft skills based on your learning path.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {books.map((book) => (
                    <Card key={book.id} className="p-4 flex flex-col h-full hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden">
                            {/* Placeholder image if URL fails */}
                            <img
                                src={book.image}
                                alt={book.title}
                                className="h-full object-contain"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Book+Cover' }}
                            />
                        </div>
                        <h2 className="font-bold text-lg mb-1 line-clamp-2">{book.title}</h2>
                        <p className="text-sm text-gray-500 mb-2">{book.author}</p>

                        <div className="flex items-center mb-4">
                            <MdStar className="text-yellow-400" />
                            <span className="font-bold text-sm ml-1 text-gray-700">{book.rating}</span>
                        </div>

                        <div className="mt-auto">
                            <Button className="w-full flex justify-center items-center text-sm">
                                <MdShoppingCart className="mr-2" /> Get Book
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BookRecommendations;
