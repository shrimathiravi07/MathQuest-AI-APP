    // -------------------------------------------------------------------------
    // 1. CONFIGURABLE API & AUTHENTICATION STATE
    // -------------------------------------------------------------------------
    const APP_STATE = {
      apiBaseUrl: window.location.origin + '/api',
      backendLive: false,
      authMode: 'login', // 'login' | 'register'
      selectedLoginGrade: 5,
      sessionToken: null,
      currentStudent: null,
      currentScreen: 'login',
      currentTopic: 'fractions',
      currentLessonStep: 0,
      // Interactive manipulative states
      pizzaTotalSlices: 4,
      pizzaSelectedSlices: [true, false, false, false],
      balloonSelectedIndices: [0, 2],
      ratioGroupCount: 2,
      shapeInspectMode: 'faces',
      shapeRotationSpeed: 1,
      // Quiz state
      quizQuestions: [],
      quizCurrentIndex: 0,
      quizSelectedOption: null,
      quizSubmitted: false,
      quizRoundScore: 0,
      // Accessibility & Audio
      soundEnabled: true,
      reducedMotion: false,
      threeCameraTarget: 'overview'
    };

    // Safe localStorage wrapper
    function safeGetStorage(key, fallback) {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
      } catch (e) {
        return fallback;
      }
    }

    function safeSetStorage(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        // Ignore in sandboxed iframe
      }
    }

    // Seeded Student Accounts for In-Browser FastAPI-Compatible Verification Engine
    // (Used when localhost:8000 is not reachable inside the Canvas preview iframe)
    const INITIAL_STUDENTS_DB = {
      leo_g5: {
        username: 'leo_g5',
        display_name: 'Leo the Explorer',
        password_key: 'math5fun',
        grade: 5,
        avatar: '🦊',
        stars: 5,
        completed_lessons: ['fractions'],
        quiz_scores: { fractions: 3, decimals: 0, ratios: 0, shapes: 0 },
        badges: ['first_login', 'fraction_slicer']
      },
      maya_g6: {
        username: 'maya_g6',
        display_name: 'Maya the Cosmic Champion',
        password_key: 'space6win',
        grade: 6,
        avatar: '🤖',
        stars: 7,
        completed_lessons: ['fractions', 'ratios'],
        quiz_scores: { fractions: 4, decimals: 0, ratios: 3, shapes: 0 },
        badges: ['first_login', 'crystal_diviner', 'ratio_pilot']
      }
    };

    let LOCAL_STUDENTS_DB = safeGetStorage('mathquest_students_v2', INITIAL_STUDENTS_DB);

    // -------------------------------------------------------------------------
    // 2. CURRICULUM CONTENT FOR GRADE 5 & GRADE 6 (SEPARATE WORLDS & QUIZZES)
    // -------------------------------------------------------------------------
    const CURRICULUM = {
      5: {
        worldHeading: 'Welcome, Math Explorer!',
        worldSubtitle: "Let's play and learn math!",
        mascotName: 'Barnaby the Explorer Fox',
        mascotEmoji: '🦊',
        topics: {
          fractions: {
            id: 'fractions',
            title: 'Fractions',
            subtitle: 'Colourful Pizza Slices',
            cardDesc: 'Slice warm 3D pizzas into equal parts and discover how 1/4, 2/4, and 3/4 work!',
            badgeColor: 'from-amber-400 to-orange-500',
            icon: '🍕',
            steps: [
              {
                heading: 'Fractions Are Parts!',
                lines: [
                  '"A fraction shows part of a whole."',
                  '"Imagine a pizza cut into 4 equal slices."',
                  '"One slice is 1/4 of the pizza."'
                ],
                example: 'Look at the 4-slice pizza on the right! When 1 slice is glowing, that is 1 out of 4 equal parts, written as 1/4.'
              },
              {
                heading: 'Top & Bottom Numbers!',
                lines: [
                  '"The top number (numerator) counts how many slices you pick."',
                  '"The bottom number (denominator) counts all equal slices in the whole pizza."',
                  '"Click 2 slices to make 2/4 — that is the exact same as 1/2!"'
                ],
                example: 'Try clicking 2 slices on the 3D pizza! 2 slices out of 4 equal slices covers half the pizza (2/4 = 1/2).'
              },
              {
                heading: 'Adding Equal Slices!',
                lines: [
                  '"When slices are the same size, adding fractions is super easy!"',
                  '"Just add the top numbers and keep the bottom number the same."',
                  '"1/4 + 2/4 = 3/4 of a delicious pizza!"'
                ],
                example: 'Click 3 slices on the pizza to see 3/4, or click all 4 slices to make 4/4 (1 whole pizza)!'
              }
            ],
            quiz: [
              {
                id: 'g5_f1',
                difficulty: 'Easy',
                question: 'What is 1/2 of 8?',
                options: ['2', '4', '6', '8'],
                correctIndex: 1,
                explanation: 'Sharing 8 equally into 2 groups gives 8 ÷ 2 = 4!'
              },
              {
                id: 'g5_f2',
                difficulty: 'Easy',
                question: 'A pizza is cut into 4 equal slices. You eat 3 slices. What fraction did you eat?',
                options: ['1/4', '2/4', '3/4', '4/3'],
                correctIndex: 2,
                explanation: '3 slices chosen out of 4 equal slices is 3/4 of the pizza!'
              },
              {
                id: 'g5_f3',
                difficulty: 'Medium',
                question: 'Which fraction covers the exact same amount as 1/2?',
                options: ['2/4', '1/4', '3/4', '1/8'],
                correctIndex: 0,
                explanation: '2 slices out of 4 is half the pizza, so 2/4 = 1/2!'
              },
              {
                id: 'g5_f4',
                difficulty: 'Challenge',
                question: 'What is 1/4 + 2/4?',
                options: ['3/8', '3/4', '2/8', '4/4'],
                correctIndex: 1,
                explanation: 'Add the top numbers (1 + 2 = 3) and keep the bottom number (4) to get 3/4!'
              }
            ]
          },
          decimals: {
            id: 'decimals',
            title: 'Decimals',
            subtitle: 'Number Balloons',
            cardDesc: 'Float colourful number balloons into the sky to match tenths and quarters like 0.25 and 0.5!',
            badgeColor: 'from-cyan-400 to-blue-500',
            icon: '🎈',
            steps: [
              {
                heading: 'Decimals Float Like Balloons!',
                lines: [
                  '"A decimal uses a dot (decimal point) to show parts smaller than 1."',
                  '"Imagine 1 whole split into 10 equal tenths."',
                  '"Five tenths is written as 0.5 — half of 1 whole!"'
                ],
                example: 'Pop or float the 0.25 and 0.5 balloons on the right to watch the Decimal Sky Meter fill up!'
              },
              {
                heading: 'Quarters as Decimals!',
                lines: [
                  '"Just like coins, 1 quarter of 1.00 is 0.25."',
                  '"Two quarters make 0.50 (or 0.5)."',
                  '"Three quarters make 0.75!"'
                ],
                example: 'Combine the 0.25 balloon and the 0.5 balloon: 0.25 + 0.50 = 0.75!'
              },
              {
                heading: 'Comparing Decimal Balloons!',
                lines: [
                  '"Look at the first digit after the dot (the tenths place) first."',
                  '"0.8 is bigger than 0.45 because 8 tenths beats 4 tenths!"',
                  '"You can write 0.8 as 0.80 to compare easily."'
                ],
                example: '0.80 has 80 hundredths, while 0.45 has 45 hundredths — so 0.8 floats higher!'
              }
            ],
            quiz: [
              {
                id: 'g5_d1',
                difficulty: 'Easy',
                question: 'Which decimal balloon equals 1/2?',
                options: ['0.2', '0.25', '0.5', '0.75'],
                correctIndex: 2,
                explanation: '5 tenths (0.5) is exactly half of 1 whole!'
              },
              {
                id: 'g5_d2',
                difficulty: 'Easy',
                question: 'What is 0.4 + 0.3?',
                options: ['0.7', '0.1', '0.07', '7.0'],
                correctIndex: 0,
                explanation: '4 tenths plus 3 tenths equals 7 tenths (0.7)!'
              },
              {
                id: 'g5_d3',
                difficulty: 'Medium',
                question: 'Which number balloon has the greatest value?',
                options: ['0.25', '0.8', '0.45', '0.7'],
                correctIndex: 1,
                explanation: 'Check the tenths digit first: 0.8 has 8 tenths, which is greater than 2, 4, or 7 tenths!'
              },
              {
                id: 'g5_d4',
                difficulty: 'Challenge',
                question: 'What is 1.0 - 0.25?',
                options: ['0.5', '0.75', '0.85', '0.25'],
                correctIndex: 1,
                explanation: '1.00 minus 0.25 leaves 0.75 (three quarters)!'
              }
            ]
          },
          ratios: {
            id: 'ratios',
            title: 'Ratios',
            subtitle: 'Groups of Colourful Objects',
            cardDesc: 'Compare groups of forest apples, glowing stars, and gems to build balanced ratios!',
            badgeColor: 'from-pink-400 to-rose-500',
            icon: '🍎',
            steps: [
              {
                heading: 'Ratios Compare Two Groups!',
                lines: [
                  '"A ratio compares how many of one thing there are to another."',
                  '"Imagine 3 red apples and 2 green pears in a basket."',
                  '"The ratio of apples to pears is 3:2!"'
                ],
                example: 'Click "+ Add Group" in the 3D Toy Lab to add another basket of 3 apples and 2 pears!'
              },
              {
                heading: 'Order Matters in Ratios!',
                lines: [
                  '"Always read which item comes first in the question."',
                  '"Apples to pears is 3:2."',
                  '"Pears to apples is 2:3!"'
                ],
                example: 'If there are 3 apples and 2 pears per basket, 2 baskets have 6 apples and 4 pears (6:4)!'
              },
              {
                heading: 'Scaling Up Groups!',
                lines: [
                  '"When we multiply both parts by the same number, we get an equivalent ratio."',
                  '"1 basket = 3:2."',
                  '"3 baskets = 9:6!"'
                ],
                example: '3 × 3 = 9 apples and 2 × 3 = 6 pears. Both parts grew 3 times bigger!'
              }
            ],
            quiz: [
              {
                id: 'g5_r1',
                difficulty: 'Easy',
                question: 'A basket has 3 red apples and 2 green pears. What is the ratio of apples to pears?',
                options: ['2:3', '3:2', '3:5', '5:3'],
                correctIndex: 1,
                explanation: 'Apples are named first (3) and pears second (2), so the ratio is 3:2!'
              },
              {
                id: 'g5_r2',
                difficulty: 'Easy',
                question: 'If 1 toy box holds 4 blocks, how many blocks do 3 toy boxes hold?',
                options: ['7', '8', '12', '16'],
                correctIndex: 2,
                explanation: '3 boxes × 4 blocks per box = 12 blocks!'
              },
              {
                id: 'g5_r3',
                difficulty: 'Medium',
                question: 'Which ratio is equivalent to 1:2?',
                options: ['2:4', '2:3', '3:4', '4:2'],
                correctIndex: 0,
                explanation: 'Multiply both numbers in 1:2 by 2 to get 2:4!'
              },
              {
                id: 'g5_r4',
                difficulty: 'Challenge',
                question: 'You earn 4 stars for every 1 trophy. How many stars for 2 trophies?',
                options: ['5', '6', '8', '10'],
                correctIndex: 2,
                explanation: '2 trophies × 4 stars = 8 stars!'
              }
            ]
          },
          shapes: {
            id: 'shapes',
            title: 'Shapes',
            subtitle: 'Geometric Toy Houses',
            cardDesc: 'Inspect 3D geometric toy houses, triangles, squares, and cubes from every angle!',
            badgeColor: 'from-emerald-400 to-teal-500',
            icon: '🏠',
            steps: [
              {
                heading: 'Shapes Build Our World!',
                lines: [
                  '"2D flat shapes like squares and triangles join together to build 3D toy houses!"',
                  '"A square has 4 equal sides and 4 square corners (90°)."',
                  '"A triangle has 3 sides and 3 corners that add up to 180°."'
                ],
                example: 'Use the 3D Shape Inspector on the right to highlight the Roof (Triangle) and Walls (Cube)!'
              },
              {
                heading: 'Faces, Edges, and Vertices!',
                lines: [
                  '"A flat surface on a 3D shape is called a Face."',
                  '"Where two faces meet is an Edge."',
                  '"A corner point is a Vertex!"'
                ],
                example: 'A 3D number cube has 6 flat square faces, 12 edges, and 8 corner vertices!'
              },
              {
                heading: 'Perimeter Around the Outside!',
                lines: [
                  '"Perimeter is the total distance around the outside of a flat shape."',
                  '"For a rectangle with length 5 cm and width 3 cm, add all 4 sides:"',
                  '"5 + 3 + 5 + 3 = 16 cm!"'
                ],
                example: 'Walking all the way around a 5m by 3m garden takes 16 meters!'
              }
            ],
            quiz: [
              {
                id: 'g5_s1',
                difficulty: 'Easy',
                question: 'How many equal sides does a square have?',
                options: ['3', '4', '5', '6'],
                correctIndex: 1,
                explanation: 'Every square has 4 equal sides and 4 right-angle corners!'
              },
              {
                id: 'g5_s2',
                difficulty: 'Medium',
                question: 'A toy house roof is a triangle. What do the 3 angles inside any triangle add up to?',
                options: ['90°', '180°', '270°', '360°'],
                correctIndex: 1,
                explanation: 'The 3 interior angles of any triangle always total 180°!'
              },
              {
                id: 'g5_s3',
                difficulty: 'Medium',
                question: 'How many flat square faces does a 3D number cube have?',
                options: ['4', '6', '8', '12'],
                correctIndex: 1,
                explanation: 'Top, bottom, front, back, left, and right make 6 square faces!'
              },
              {
                id: 'g5_s4',
                difficulty: 'Challenge',
                question: 'What is the perimeter of a rectangle with length 5 cm and width 3 cm?',
                options: ['8 cm', '15 cm', '16 cm', '20 cm'],
                correctIndex: 2,
                explanation: 'Add all 4 sides around the outside: 5 + 3 + 5 + 3 = 16 cm!'
              }
            ]
          }
        }
      },

      // =======================================================================
      // GRADE 6 CURRICULUM (More advanced visuals, examples & cosmic theme)
      // =======================================================================
      6: {
        worldHeading: 'Welcome, Math Champion!',
        worldSubtitle: 'Ready for a new math adventure?',
        mascotName: 'Nova-6 the Cosmic Math Bot',
        mascotEmoji: '🤖',
        topics: {
          fractions: {
            id: 'fractions',
            title: 'Fractions',
            subtitle: 'Crystal Potion Division & Mixed Numbers',
            cardDesc: 'Divide glowing 1/8 crystal energy cells, multiply fractions, and master mixed numbers!',
            badgeColor: 'from-purple-500 to-indigo-600',
            icon: '🔮',
            steps: [
              {
                heading: 'Dividing Fractions with Crystal Cells!',
                lines: [
                  '"In Grade 6, we discover how many smaller fractions fit inside a larger fraction!"',
                  '"Imagine a crystal flask filled to 3/4 capacity."',
                  '"How many 1/8 mini-potions can it fill? 3/4 ÷ 1/8 = 6!"'
                ],
                example: 'Click the 8-slice Cosmic Crystal Pizza on the right! 3/4 equals 6 of the 1/8 slices (6/8)!'
              },
              {
                heading: 'Keep, Change, Flip (Reciprocals)!',
                lines: [
                  '"To divide by a fraction, multiply by its reciprocal (flipped fraction)."',
                  '"Keep the first fraction: 3/4."',
                  '"Flip 1/8 to 8/1 and multiply: (3 × 8) ÷ 4 = 24 ÷ 4 = 6!"'
                ],
                example: 'Dividing by 1/8 is the same as multiplying by 8!'
              },
              {
                heading: 'Multiplying & Simplifying Fractions!',
                lines: [
                  '"To multiply two fractions, multiply the numerators and multiply the denominators."',
                  '"2/3 × 3/5 = 6/15."',
                  '"Divide top and bottom by 3 to simplify: 2/5!"'
                ],
                example: 'Canceling the common factor 3 before multiplying gives 2/5 right away!'
              }
            ],
            quiz: [
              {
                id: 'g6_f1',
                difficulty: 'Medium',
                question: 'How many 1/8 crystal potions fit inside 3/4 of a flask? (3/4 ÷ 1/8)',
                options: ['3', '4', '6', '8'],
                correctIndex: 2,
                explanation: 'Multiply by the reciprocal: (3/4) × (8/1) = 24/4 = 6 potions!'
              },
              {
                id: 'g6_f2',
                difficulty: 'Medium',
                question: 'What is 2/3 × 3/5 in simplest form?',
                options: ['6/8', '2/5', '5/8', '3/5'],
                correctIndex: 1,
                explanation: '2/3 × 3/5 = 6/15. Divide numerator and denominator by 3 to get 2/5!'
              },
              {
                id: 'g6_f3',
                difficulty: 'Medium',
                question: 'Convert the improper fraction 11/4 into a mixed number.',
                options: ['2 1/4', '2 3/4', '3 1/4', '1 3/4'],
                correctIndex: 1,
                explanation: '11 ÷ 4 = 2 wholes (8/4) with 3/4 remaining: 2 3/4!'
              },
              {
                id: 'g6_f4',
                difficulty: 'Challenge',
                question: 'What is 5/6 - 1/3 in simplest form?',
                options: ['4/3', '1/2', '2/3', '1/6'],
                correctIndex: 1,
                explanation: 'Rewrite 1/3 as 2/6. Then 5/6 - 2/6 = 3/6 = 1/2!'
              }
            ]
          },
          decimals: {
            id: 'decimals',
            title: 'Decimals',
            subtitle: 'Orbital Thousandths & Operations',
            cardDesc: 'Calibrate starship fuel gauges with thousandths (0.375), decimal multiplication, and division!',
            badgeColor: 'from-cyan-500 to-blue-600',
            icon: '🚀',
            steps: [
              {
                heading: 'Thousandths Power the Starship!',
                lines: [
                  '"Three places after the decimal point is the thousandths place."',
                  '"0.375 means 375 thousandths — which equals the fraction 3/8!"',
                  '"When we multiply by 100, the decimal point shifts 2 places right: 37.5!"'
                ],
                example: 'Select the cosmic fuel pods on the right to see how tenths, hundredths, and thousandths combine!'
              },
              {
                heading: 'Multiplying Decimals!',
                lines: [
                  '"Multiply the numbers just like whole numbers first."',
                  '"Then count the total decimal places in both factors."',
                  '"2.4 × 1.5 = 3.60 (or 3.6)!"'
                ],
                example: '24 × 15 = 360. With 2 decimal digits total, place the dot to get 3.60!'
              },
              {
                heading: 'Dividing by a Decimal!',
                lines: [
                  '"How many 0.5 L fuel cells fit into a 4.5 L tank?"',
                  '"Multiply both numbers by 10 to clear the decimal: 45 ÷ 5 = 9!"',
                  '"So 4.5 ÷ 0.5 = 9 fuel cells!"'
                ],
                example: 'Dividing by 0.5 (one half) doubles the number: 4.5 × 2 = 9!'
              }
            ],
            quiz: [
              {
                id: 'g6_d1',
                difficulty: 'Easy',
                question: 'A starship booster uses 0.375 L of plasma per jump. How much for 100 jumps?',
                options: ['3.75 L', '37.5 L', '375 L', '0.0375 L'],
                correctIndex: 1,
                explanation: 'Multiplying by 100 shifts the decimal point 2 places to the right: 37.5 L!'
              },
              {
                id: 'g6_d2',
                difficulty: 'Medium',
                question: 'What is 2.4 × 1.5?',
                options: ['3.6', '3.0', '2.9', '36.0'],
                correctIndex: 0,
                explanation: '2.4 × 1 = 2.4 and 2.4 × 0.5 = 1.2. Together 2.4 + 1.2 = 3.6!'
              },
              {
                id: 'g6_d3',
                difficulty: 'Medium',
                question: 'What is 4.5 ÷ 0.5?',
                options: ['0.9', '2.25', '9', '90'],
                correctIndex: 2,
                explanation: 'Multiply both by 10: 45 ÷ 5 = 9!'
              },
              {
                id: 'g6_d4',
                difficulty: 'Challenge',
                question: 'Which decimal is equivalent to the fraction 3/8?',
                options: ['0.38', '0.375', '0.325', '0.625'],
                correctIndex: 1,
                explanation: 'Since 1/8 = 0.125, 3 × 0.125 = 0.375!'
              }
            ]
          },
          ratios: {
            id: 'ratios',
            title: 'Ratios',
            subtitle: 'Unit Rates, Speed & Proportions',
            cardDesc: 'Calculate cosmic rover speeds (km/h), scale crystal ratios, and solve percentages!',
            badgeColor: 'from-fuchsia-500 to-pink-600',
            icon: '⚡',
            steps: [
              {
                heading: 'Unit Rates Measure Per 1 Unit!',
                lines: [
                  '"A unit rate tells us how much for just 1 unit (like 1 hour or 1 item)."',
                  '"If a cosmic rover travels 150 km in 3 hours..."',
                  '"Divide 150 ÷ 3 = 50 km per hour (50 km/h)!"'
                ],
                example: 'Scale the Cosmic Ratio Thrusters on the right to see how equivalent ratios stay in proportion!'
              },
              {
                heading: 'Solving Ratio Proportions!',
                lines: [
                  '"Suppose blue crystals to purple gems are in a 3:5 ratio."',
                  '"If you collect 20 purple gems, what is the scale factor?"',
                  '"20 ÷ 5 = 4! So multiply blue crystals by 4 too: 3 × 4 = 12!"'
                ],
                example: '3:5 and 12:20 are equivalent ratios because both parts are multiplied by 4!'
              },
              {
                heading: 'Percentages Are Ratios Out of 100!',
                lines: [
                  '"Percent means per hundred (out of 100)."',
                  '"25% is 25/100, or 1/4."',
                  '"So 25% of 80 cosmic stars is 80 ÷ 4 = 20 stars!"'
                ],
                example: 'To find 25% of any number quickly, divide it by 4!'
              }
            ],
            quiz: [
              {
                id: 'g6_r1',
                difficulty: 'Easy',
                question: 'A cosmic rover travels 150 km in 3 hours. What is its unit rate in km/h?',
                options: ['30 km/h', '45 km/h', '50 km/h', '75 km/h'],
                correctIndex: 2,
                explanation: 'Divide total distance by total time: 150 km ÷ 3 hours = 50 km/h!'
              },
              {
                id: 'g6_r2',
                difficulty: 'Medium',
                question: 'The ratio of blue crystals to purple gems is 3:5. If there are 20 purple gems, how many blue crystals are there?',
                options: ['9', '12', '15', '18'],
                correctIndex: 1,
                explanation: 'Since 5 × 4 = 20, multiply 3 by 4 as well: 3 × 4 = 12 blue crystals!'
              },
              {
                id: 'g6_r3',
                difficulty: 'Medium',
                question: 'What is 25% of 80 cosmic stars?',
                options: ['15', '20', '25', '40'],
                correctIndex: 1,
                explanation: '25% equals 1/4, and 80 ÷ 4 = 20 stars!'
              },
              {
                id: 'g6_r4',
                difficulty: 'Challenge',
                question: 'Simplify the ratio 18:24 to its simplest form.',
                options: ['2:3', '3:4', '4:3', '6:8'],
                correctIndex: 1,
                explanation: 'Divide both 18 and 24 by their greatest common factor (6) to get 3:4!'
              }
            ]
          },
          shapes: {
            id: 'shapes',
            title: 'Shapes',
            subtitle: '3D Volume, Surface Area & Coordinates',
            cardDesc: 'Compute the 3D volume of rectangular prisms, unfold surface area nets, and measure triangles!',
            badgeColor: 'from-violet-500 to-purple-600',
            icon: '🔷',
            steps: [
              {
                heading: '3D Volume Fills Space Inside!',
                lines: [
                  '"Volume measures how many 1×1×1 unit cubes fit inside a 3D prism."',
                  '"Formula: Volume = length × width × height (V = l × w × h)."',
                  '"A crystal box 4 m long, 3 m wide, and 5 m high has V = 4 × 3 × 5 = 60 m³!"'
                ],
                example: 'Toggle the 3D Prism Inspector on the right to see Volume, Surface Area, and Triangle Area!'
              },
              {
                heading: 'Area of Triangles!',
                lines: [
                  '"Every triangle is exactly half of a rectangle or parallelogram with the same base and height."',
                  '"Formula: Area = 1/2 × base × height."',
                  '"If base = 10 cm and height = 6 cm, Area = 1/2 × 10 × 6 = 30 cm²!"'
                ],
                example: '10 × 6 = 60, and half of 60 is 30 cm²!'
              },
              {
                heading: 'Surface Area of a 3D Cube!',
                lines: [
                  '"Surface area is the total area of all outer faces unfolded into a flat net."',
                  '"A cube has 6 identical square faces."',
                  '"If each edge is 3 cm, one face is 3 × 3 = 9 cm², so 6 faces = 6 × 9 = 54 cm²!"'
                ],
                example: 'Unfolding a 3 cm cube shows 6 squares of 9 cm² each = 54 cm² total!'
              }
            ],
            quiz: [
              {
                id: 'g6_s1',
                difficulty: 'Easy',
                question: 'What is the volume of a 3D crystal prism with length 4 m, width 3 m, and height 5 m?',
                options: ['12 m³', '47 m³', '60 m³', '94 m³'],
                correctIndex: 2,
                explanation: 'Volume = length × width × height = 4 × 3 × 5 = 60 m³!'
              },
              {
                id: 'g6_s2',
                difficulty: 'Medium',
                question: 'What is the area of a triangle with base 10 cm and height 6 cm?',
                options: ['16 cm²', '30 cm²', '60 cm²', '120 cm²'],
                correctIndex: 1,
                explanation: 'Area = 1/2 × base × height = 0.5 × 10 × 6 = 30 cm²!'
              },
              {
                id: 'g6_s3',
                difficulty: 'Medium',
                question: 'A 3D cube has edges of length 3 cm. What is its total surface area across all 6 faces?',
                options: ['9 cm²', '27 cm²', '36 cm²', '54 cm²'],
                correctIndex: 3,
                explanation: 'Each square face is 3 × 3 = 9 cm². Across 6 faces, 6 × 9 = 54 cm²!'
              },
              {
                id: 'g6_s4',
                difficulty: 'Challenge',
                question: 'On a coordinate grid, what is the distance between (2, 5) and (9, 5)?',
                options: ['5 units', '7 units', '10 units', '11 units'],
                correctIndex: 1,
                explanation: 'Because the y-coordinates are both 5, subtract the x-coordinates: 9 - 2 = 7 units!'
              }
            ]
          }
        }
      }
    };

    // -------------------------------------------------------------------------

// Expose data models and state to global window
window.APP_STATE = APP_STATE;
window.CURRICULUM = CURRICULUM;
window.CURRICULUM_DATA = CURRICULUM;
window.INITIAL_STUDENTS_DB = INITIAL_STUDENTS_DB;
window.LOCAL_STUDENTS_DB = LOCAL_STUDENTS_DB;
