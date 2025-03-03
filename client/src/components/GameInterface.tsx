import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Coins, Award } from "lucide-react";
import { motion } from "framer-motion";

interface GameInterfaceProps {
  score: number;
  lives: number;
  isGameOver: boolean;
  onRestart: () => void;
}

export default function GameInterface({ score, lives, isGameOver, onRestart }: GameInterfaceProps) {
  return (
    <div className="absolute z-10 top-0 left-0 w-full p-4">
      {isGameOver ? (
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gradient">Game Over</h1>
          <p className="text-2xl mb-6">Your score: {score}</p>
          <Button 
            onClick={onRestart}
            className="text-lg py-6 px-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Play Again
          </Button>
        </motion.div>
      ) : (
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Badge variant="outline" className="px-4 py-2 flex items-center gap-2 text-lg bg-black/40 backdrop-blur-sm">
              <Heart className="h-5 w-5 text-red-500" />
              <span>{lives}</span>
            </Badge>
            <Badge variant="outline" className="px-4 py-2 flex items-center gap-2 text-lg bg-black/40 backdrop-blur-sm">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span>{score}</span>
            </Badge>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-2 flex items-center gap-2 text-lg bg-black/40 backdrop-blur-sm">
              <Award className="h-5 w-5 text-yellow-400" />
              <span>Level 1</span>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}