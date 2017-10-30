package expand;

public class Expander {
	public static void main(String[] args){
		String[] inputString = {"LQ-KH/HS/SP-LG/LS/LB/HI-02/06","LQ-KH/HS/SP-LG/LS/LB/HI-00", "LQ-SP/HS-FD/MA/EL/CN-02/06", "LQ-SP/HS-FD/MA/EL/CN-00" };
		for (int i = 0; i < inputString.length; ++i){
			expand(inputString[i]);
			System.out.println("===============");
		}
		
	}

	public static void expand(String str) {
		
		String[] topStrings = str.split("-");
		String[][] matrixStr = {{},{},{},{}};
		for (int i = 0; i < topStrings.length; ++i) {
			matrixStr[i] = topStrings[i].split("/");
		}
		
//		for(String[] strs : matrixStr){
//			for (String s: strs){
//				System.out.print("***"+s);
//			}
//			System.out.println();
//		}
		
		for (String str1 : matrixStr[0]){
			for(String str2 : matrixStr[1]){
				for(String str3 : matrixStr[2]){
					for(String str4: matrixStr[3]){
						System.out.print(""+str1+str2+str3+str4);
						System.out.println();
					}
				}
			}
		}
		
		
		
		
		
		
	}

}
