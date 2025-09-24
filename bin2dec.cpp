/*
 *  Compile on 64-bit Linux or Solaris (I guess it will probably also work on
 * FreeBSD), like this:
 * g++ -o bin2dec bin2dec.cpp -std=c++11 #Don't put -O3
 * here, as GCC seems to ignore `volatile` in global variables.
 * Or like this:
 *  clang++ -o bin2dec bin2dec.cpp -O3
 *  Playing with inline assembly is a lot easier on UNIX-like systems than on
 * Windows.
 * */

#include <iomanip>
#include <iostream>

extern "C" {
char binary_input[9]; // I think this does not need to be volatile because the
                      // inline assembly isn't changing it. It's only reading
                      // from it.
volatile int first_digit,
    binary_coded_decimal; // GCC (but not CLANG) clobbers the `first_digit` if
                          // you turn on the optimizer in spite of the
                          // `volatile`.
}

int main() {
  std::cout << "Enter a binary number containing at most 8 digits: ";
  std::cin >> binary_input;
  asm(R"assembly(
        .intel_syntax noprefix
	
        mov r8, 0
        mov r9, 0
        input_loop:
          cmp byte ptr [binary_input + r9], '0'
          jz input_is_zero
          cmp byte ptr [binary_input + r9], '1'
          jz input_is_one
          jmp end_of_the_input_loop # The current character is presumably '\0'.
          input_is_one:
            shl r8, 1
            inc r8
            jmp end_of_branching
          input_is_zero:
            shl r8, 1
            jmp end_of_branching
          end_of_branching:
          inc r9
          jmp input_loop
        end_of_the_input_loop:
        
        mov qword ptr [first_digit], 0
        cmp r8, 200
        jc less_than_200
          sub r8, 200
          mov qword ptr [first_digit], 2
        less_than_200:
        cmp r8, 100
        jc less_than_100
          sub r8, 100
          mov qword ptr [first_digit], 1
        less_than_100:
        
        mov r9, 0
        loop_for_dividing_r8_by_10:
          cmp r8, 10
          jc end_of_the_loop_for_dividing_r8_by_10
          sub r8, 10
          inc r9
          jmp loop_for_dividing_r8_by_10
        end_of_the_loop_for_dividing_r8_by_10:
        
        shl r9, 4 # Multiply r9 by 16.
        add r9, r8
        mov qword ptr [binary_coded_decimal], r9

        .att_syntax
	)assembly");
  std::cout << "The number converted to decimal is: " << std::hex
            << std::setfill('0') << std::setw(2) << first_digit
            << std::setfill('0') << std::setw(2) << binary_coded_decimal
            << std::endl;
  return 0;
}
